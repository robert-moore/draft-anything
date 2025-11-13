import {
  draftCuratedOptionsInDa,
  draftSelectionsInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import {
  getCurrentPickNumberByGuid,
  getUsedPayloadsByGuid,
  validateAndFetchDraftByGuid
} from '@/lib/api/draft-helpers'
import { db } from '@/lib/db'
import { getElapsedSeconds } from '@/lib/time-utils'
import { getAppUrl } from '@/lib/utils/get-app-url'
import { and, eq } from 'drizzle-orm'

// Simple rate limiting for auto-picks
const recentAutoPicks = new Map<string, number>()

export async function performAutoPickForDraft(draftGuid: string) {
  try {
    // Validate and fetch draft
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) {
      console.warn(
        '[AUTO-PICK] Failed to validate draft',
        draftGuid,
        draftResult.error
      )
      return
    }
    const { draft } = draftResult

    if (draft.draftState !== 'active') return
    const secPerRound = parseInt(draft.secPerRound)
    if (secPerRound === 0 || !draft.turnStartedAt || draft.timerPaused) return
    const elapsedSeconds = getElapsedSeconds(draft.turnStartedAt)

    // Check if timer has expired
    if (elapsedSeconds < secPerRound) return

    // Safety check: Don't auto-pick if timer was just reset (likely from previous auto-pick)
    // This prevents the next player from being immediately auto-picked due to race conditions
    // Since minimum timer is 30s, this check ensures the timer truly expired (not just reset)
    // and adds a buffer to prevent race conditions between concurrent auto-pick checks
    if (elapsedSeconds < 10) return

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

    const usedPayloads = await getUsedPayloadsByGuid(draftGuid)
    let autoPickPayload: string
    let curatedOptionId: number | null = null
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

    // --- Instead of direct DB insert, call the pick API route ---
    const appUrl = getAppUrl()
    const pickUrl = `${appUrl}/api/drafts/${draftGuid}/pick`
    const secret = process.env.INTERNAL_AUTOPICK_SECRET
    if (!secret) {
      console.error('[AUTO-PICK] INTERNAL_AUTOPICK_SECRET is not set')
      return
    }

    const res = await fetch(pickUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-autopick-secret': secret
      },
      body: JSON.stringify({
        payload: draft.isFreeform ? autoPickPayload : undefined,
        curatedOptionId: !draft.isFreeform ? curatedOptionId : undefined,
        wasAutoPick: true,
        userId: currentPlayer.userId // for internal use
      })
    })
    if (res.status !== 201) {
      const errorText = await res.text()
      console.warn('[AUTO-PICK] Pick API non-201', {
        draftGuid,
        currentPickNumber,
        userId: currentPlayer.userId,
        status: res.status,
        errorText
      })
      return
    }
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
