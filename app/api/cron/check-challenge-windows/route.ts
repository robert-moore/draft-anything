import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { getElapsedSeconds } from '@/lib/time-utils'
import { clearJoinCode } from '@/lib/utils/join-code'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // Find all drafts in challenge_window state
    const challengeWindowDrafts = await db
      .select({
        id: draftsInDa.id,
        guid: draftsInDa.guid,
        turnStartedAt: draftsInDa.turnStartedAt
      })
      .from(draftsInDa)
      .where(eq(draftsInDa.draftState, 'challenge_window'))
      .limit(250)

    let expiredCount = 0

    for (const draft of challengeWindowDrafts) {
      if (!draft.turnStartedAt) continue

      const elapsedSeconds = getElapsedSeconds(draft.turnStartedAt)

      // Challenge window expires after 30 seconds
      if (elapsedSeconds >= 30) {
        // Complete the draft
        await db
          .update(draftsInDa)
          .set({
            draftState: 'completed',
            currentPositionOnClock: null
          })
          .where(eq(draftsInDa.id, draft.id))

        // Clear the join code
        await clearJoinCode(draft.id)

        expiredCount++
        console.log(`Challenge window expired for draft: ${draft.guid}`)
      }
    }

    console.log(
      `Challenge window check complete: ${expiredCount} drafts completed`
    )
    return new Response(
      `Challenge window check complete: ${expiredCount} drafts completed`,
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking expired challenge windows:', error)
    return new Response('Error checking challenge windows', { status: 500 })
  }
}