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

export async function performAutoPickForDraft(draftGuid: string) {
  try {
    // Validate and fetch draft
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return
    const { draft } = draftResult

    if (draft.draftState !== 'active') return
    
    const secPerRound = parseInt(draft.secPerRound)
    
    // Check timer requirements
    if (secPerRound > 0) {
      // Timer is enabled, check if expired
      if (!draft.turnStartedAt || draft.timerPaused) return
      
      const elapsedSeconds = getElapsedSeconds(draft.turnStartedAt)
      if (elapsedSeconds < secPerRound) return
    }
    
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

    // Check if autopick is enabled for this user
    if (!currentPlayer.autopickEnabled) return

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

    // Try to get item from user's autopick queue first
    let autoPickPayload: string
    let curatedOptionId: number | null = null
    
    const [queueResult] = await db
      .select({ queue: draftAutopickQueuesInDa.queue })
      .from(draftAutopickQueuesInDa)
      .where(
        and(
          eq(draftAutopickQueuesInDa.draftId, draft.id),
          eq(draftAutopickQueuesInDa.userId, currentPlayer.userId)
        )
      )
      .limit(1)

    const queue = (queueResult?.queue as any[]) || []
    const availableQueueItems = queue.filter(item => !item.isUsed)

    if (availableQueueItems.length > 0) {
      // Use first item from queue
      const queueItem = availableQueueItems[0]
      if (draft.isFreeform) {
        autoPickPayload = queueItem.payload || 'Auto Pick'
      } else {
        // For curated drafts, get the option text
        if (queueItem.curatedOptionId) {
          const [option] = await db
            .select({ optionText: draftCuratedOptionsInDa.optionText })
            .from(draftCuratedOptionsInDa)
            .where(eq(draftCuratedOptionsInDa.id, queueItem.curatedOptionId))
          
          if (option) {
            autoPickPayload = option.optionText
            curatedOptionId = queueItem.curatedOptionId
          } else {
            // Fallback if option not found
            autoPickPayload = 'Auto Pick (queue item not found)'
          }
        } else {
          autoPickPayload = queueItem.payload || 'Auto Pick'
        }
      }
    } else {
      // Fallback to existing random logic if queue is empty
      const usedPayloads = await getUsedPayloadsByGuid(draftGuid)
      if (draft.isFreeform) {
        autoPickPayload = generateAutoPick(usedPayloads)
      } else {
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
        if (availableOptions.length === 0) return
        const randomIndex = Math.floor(Math.random() * availableOptions.length)
        const selectedOption = availableOptions[randomIndex]
        autoPickPayload = selectedOption.optionText
        curatedOptionId = selectedOption.id
      }
    }

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
