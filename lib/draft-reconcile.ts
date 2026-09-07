import { draftSelectionsInDa, draftsInDa } from '@/drizzle/schema'
import { getDraftByGuid } from '@/lib/api/draft-guid-helpers'
import { performAutoPickForDraft } from '@/lib/auto-pick-logic'
import { db } from '@/lib/db'
import { getElapsedSeconds } from '@/lib/time-utils'
import { clearJoinCode } from '@/lib/utils/join-code'
import { desc, eq } from 'drizzle-orm'

const STALE_AFTER_MS = 24 * 60 * 60 * 1000
const CHALLENGE_WINDOW_SECONDS = 30

type DraftRow = typeof draftsInDa.$inferSelect

async function markCanceled(draftId: number) {
  await db
    .update(draftsInDa)
    .set({ draftState: 'canceled' })
    .where(eq(draftsInDa.id, draftId))
  await clearJoinCode(draftId)
}

async function cancelIfStale(draft: DraftRow): Promise<boolean> {
  const createdAt = new Date(draft.createdAt).getTime()
  const isOlderThanADay = Date.now() - createdAt >= STALE_AFTER_MS

  if (draft.draftState === 'setting_up' && isOlderThanADay) {
    await markCanceled(draft.id)
    return true
  }

  if (draft.draftState === 'active' && draft.secPerRound === '0') {
    const [lastPick] = await db
      .select({ createdAt: draftSelectionsInDa.createdAt })
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draft.id))
      .orderBy(desc(draftSelectionsInDa.createdAt))
      .limit(1)

    const lastActivity = lastPick
      ? new Date(lastPick.createdAt).getTime()
      : createdAt
    if (Date.now() - lastActivity >= STALE_AFTER_MS) {
      await markCanceled(draft.id)
      return true
    }
  }

  return false
}

async function completeExpiredChallengeWindow(
  draft: DraftRow
): Promise<boolean> {
  if (draft.draftState !== 'challenge_window' || !draft.turnStartedAt) {
    return false
  }
  if (getElapsedSeconds(draft.turnStartedAt) < CHALLENGE_WINDOW_SECONDS) {
    return false
  }

  await db
    .update(draftsInDa)
    .set({
      draftState: 'completed',
      currentPositionOnClock: null
    })
    .where(eq(draftsInDa.id, draft.id))
  await clearJoinCode(draft.id)
  return true
}

async function resolveExpiredTurn(draft: DraftRow): Promise<boolean> {
  if (draft.draftState !== 'active') return false

  const secPerRound = parseInt(draft.secPerRound)
  if (secPerRound === 0 || !draft.turnStartedAt || draft.timerPaused) {
    return false
  }
  if (getElapsedSeconds(draft.turnStartedAt) < secPerRound) return false

  if (draft.isAuction) {
    const { resolveExpiredAuction } = await import('@/lib/auction-logic')
    return resolveExpiredAuction(draft.guid)
  }

  await performAutoPickForDraft(draft.guid)
  return true
}

/**
 * Apply missed cron work when someone opens a draft: cancel abandoned
 * lobbies, close an expired challenge window, or resolve an expired turn.
 * Returns true if state changed.
 */
export async function reconcileDraftByGuid(draftGuid: string): Promise<boolean> {
  const draft = await getDraftByGuid(draftGuid)
  if (!draft) return false

  try {
    if (await cancelIfStale(draft)) return true
    if (await completeExpiredChallengeWindow(draft)) return true
    if (await resolveExpiredTurn(draft)) return true
  } catch (error) {
    console.error(`Failed to reconcile draft ${draftGuid}:`, error)
  }

  return false
}
