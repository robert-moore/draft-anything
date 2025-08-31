import {
  draftAutopickQueuesInDa,
  draftCuratedOptionsInDa,
  draftSelectionsInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import {
  calculateNextDrafter,
  getCurrentPickNumberByGuid,
  getParticipantCountByGuid,
  getUsedPayloadsByGuid,
  updateDraftAfterPickByGuid,
  validateAndFetchDraftByGuid
} from '@/lib/api/draft-helpers'
import { db } from '@/lib/db'
import { getElapsedSeconds } from '@/lib/time-utils'
import { and, eq } from 'drizzle-orm'

// Simple rate limiting for auto-picks
const recentAutoPicks = new Map<string, number>()

// Clean autopick function - handles both immediate and safety net cases
export async function performAutopick(draftGuid: string) {
  try {
    // Validate and fetch draft
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return
    const { draft } = draftResult

    if (draft.draftState !== 'active') return
    if (!draft.currentPositionOnClock) return

    const [currentPlayer] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.position, draft.currentPositionOnClock)
        )
      )
    
    if (!currentPlayer || !currentPlayer.userId) return

    // Determine if autopick should run
    if (!shouldPerformAutopick(draft, currentPlayer)) return

    const rateLimitKey = `${draftGuid}-${currentPlayer.userId}`
    const now = Date.now()
    const lastAutoPickTime = recentAutoPicks.get(rateLimitKey)
    if (lastAutoPickTime && now - lastAutoPickTime < 5000) return

    const currentPickNumber = await getCurrentPickNumberByGuid(draftGuid)
    const existingPick = await db
      .select()
      .from(draftSelectionsInDa)
      .where(
        and(
          eq(draftSelectionsInDa.draftId, draft.id),
          eq(draftSelectionsInDa.pickNumber, currentPickNumber)
        )
      )
    if (existingPick.length > 0) return

    // Get pick selection (try queue first, then fallback)
    const pickSelection = await getPickSelection(draft, currentPlayer.userId, draftGuid)
    if (!pickSelection) return
    
    const { payload: autoPickPayload, curatedOptionId } = pickSelection

    // Create the pick using shared logic
    const { createPick } = await import('./pick-logic')
    const pickResult = await createPick({
      draft: {
        id: draft.id,
        guid: draftGuid,
        currentPositionOnClock: draft.currentPositionOnClock,
        numRounds: draft.numRounds,
        isFreeform: draft.isFreeform
      },
      userId: currentPlayer.userId,
      pickNumber: currentPickNumber,
      payload: draft.isFreeform ? autoPickPayload : null,
      curatedOptionId: !draft.isFreeform ? curatedOptionId : null,
      wasAutoPick: true,
      skipTurnValidation: true // Autopick already verified the turn
    })

    if (!pickResult.success) {
      console.warn('[AUTO-PICK] Failed to create pick', {
        draftGuid,
        currentPickNumber,
        userId: currentPlayer.userId,
        error: pickResult.error
      })
      return
    }

    // Update draft state for next player
    const numParticipants = await getParticipantCountByGuid(draftGuid)
    const { nextPosition, isDraftCompleted } = calculateNextDrafter(
      currentPickNumber,
      numParticipants,
      draft.numRounds
    )

    await updateDraftAfterPickByGuid(
      draftGuid,
      nextPosition,
      isDraftCompleted,
      true
    )


    recentAutoPicks.set(rateLimitKey, now)
    for (const [key, timestamp] of recentAutoPicks.entries()) {
      if (now - timestamp > 10000) {
        recentAutoPicks.delete(key)
      }
    }
  } catch (error: any) {
    console.error('[AUTO-PICK] Error', error)
  }
}

// Determine if autopick should run based on current draft state
function shouldPerformAutopick(draft: any, currentPlayer: any): boolean {
  const secPerRound = parseInt(draft.secPerRound)
  
  // Case 1: User has autopick enabled - always run immediately
  if (currentPlayer.autopickEnabled) return true
  
  // Case 2: Safety net for timed drafts - run if timer expired
  if (secPerRound > 0 && draft.turnStartedAt && !draft.timerPaused) {
    const elapsedSeconds = getElapsedSeconds(draft.turnStartedAt)
    return elapsedSeconds >= secPerRound
  }
  
  // Case 3: No autopick needed
  return false
}

// Get the appropriate pick selection - try queue first, then fallback
async function getPickSelection(
  draft: any, 
  userId: string, 
  draftGuid: string
): Promise<{ payload: string; curatedOptionId: number | null } | null> {
  // Try to get item from user's autopick queue first
  const [queueResult] = await db
    .select({ queue: draftAutopickQueuesInDa.queue })
    .from(draftAutopickQueuesInDa)
    .where(
      and(
        eq(draftAutopickQueuesInDa.draftId, draft.id),
        eq(draftAutopickQueuesInDa.userId, userId)
      )
    )
    .limit(1)

  const queue = (queueResult?.queue as any[]) || []
  const availableQueueItems = queue.filter(item => !item.isUsed)

  if (availableQueueItems.length > 0) {
    // Use first item from queue
    const queueItem = availableQueueItems[0]
    if (draft.isFreeform) {
      return {
        payload: queueItem.payload || 'Auto Pick',
        curatedOptionId: null
      }
    } else {
      // For curated drafts, get the option text
      if (queueItem.curatedOptionId) {
        const [option] = await db
          .select({ optionText: draftCuratedOptionsInDa.optionText })
          .from(draftCuratedOptionsInDa)
          .where(eq(draftCuratedOptionsInDa.id, queueItem.curatedOptionId))
        
        if (option) {
          return {
            payload: option.optionText,
            curatedOptionId: queueItem.curatedOptionId
          }
        }
      }
      // Fallback if curated option not found
      return {
        payload: queueItem.payload || 'Auto Pick',
        curatedOptionId: null
      }
    }
  } else {
    // No queue items - fallback logic
    if (draft.isFreeform) {
      const usedPayloads = await getUsedPayloadsByGuid(draftGuid)
      return {
        payload: generateAutoPick(usedPayloads),
        curatedOptionId: null
      }
    } else {
      // Curated draft - pick random available option
      const availableOptions = await db
        .select({
          id: draftCuratedOptionsInDa.id,
          optionText: draftCuratedOptionsInDa.optionText
        })
        .from(draftCuratedOptionsInDa)
        .where(
          and(
            eq(draftCuratedOptionsInDa.draftId, draft.id),
            eq(draftCuratedOptionsInDa.isUsed, false)
          )
        )
      
      if (availableOptions.length === 0) return null
      
      const randomIndex = Math.floor(Math.random() * availableOptions.length)
      const selectedOption = availableOptions[randomIndex]
      
      return {
        payload: selectedOption.optionText,
        curatedOptionId: selectedOption.id
      }
    }
  }
}

function generateAutoPick(usedPayloads: string[]): string {
  // Generate simple auto-pick with counter
  let counter = 1
  while (true) {
    const pick = `Auto Pick #${counter}`
    if (!usedPayloads.includes(pick.toLowerCase())) {
      return pick
    }
    counter++
  }
}
