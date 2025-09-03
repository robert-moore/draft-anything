import { draftSelectionsInDa, draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { clearJoinCode } from '@/lib/utils/join-code'
import { and, desc, eq, lt } from 'drizzle-orm'

export async function GET() {
  try {
    let canceledCount = 0

    // Calculate the timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Find drafts that are in setting_up status and older than 24 hours
    const oldDrafts = await db
      .select({
        id: draftsInDa.id,
        guid: draftsInDa.guid,
        name: draftsInDa.name,
        createdAt: draftsInDa.createdAt
      })
      .from(draftsInDa)
      .where(
        and(
          eq(draftsInDa.draftState, 'setting_up'),
          lt(draftsInDa.createdAt, twentyFourHoursAgo.toISOString())
        )
      )

    // Cancel each old draft
    for (const draft of oldDrafts) {
      try {
        // Update the draft state to canceled
        await db
          .update(draftsInDa)
          .set({ draftState: 'canceled' })
          .where(eq(draftsInDa.id, draft.id))

        // Clear the join code
        await clearJoinCode(draft.id)

        canceledCount++
      } catch (error) {
        console.error(`Failed to cancel draft ${draft.guid}:`, error)
      }
    }

    // Find untimed drafts that are active and haven't had a pick made in 24 hours
    const untimedDrafts = await db
      .select({
        id: draftsInDa.id,
        guid: draftsInDa.guid,
        name: draftsInDa.name,
        createdAt: draftsInDa.createdAt
      })
      .from(draftsInDa)
      .where(
        and(
          eq(draftsInDa.draftState, 'active'),
          eq(draftsInDa.secPerRound, '0') // Untimed drafts
        )
      )

    // Check each untimed draft for recent picks
    for (const draft of untimedDrafts) {
      try {
        // Get the most recent pick for this draft
        const lastPick = await db
          .select({
            createdAt: draftSelectionsInDa.createdAt
          })
          .from(draftSelectionsInDa)
          .where(eq(draftSelectionsInDa.draftId, draft.id))
          .orderBy(desc(draftSelectionsInDa.createdAt))
          .limit(1)

        let shouldCancel = false

        if (lastPick.length === 0) {
          // No picks have been made - check if draft is older than 24 hours
          if (new Date(draft.createdAt) < twentyFourHoursAgo) {
            shouldCancel = true
          }
        } else {
          // Check if the last pick was made more than 24 hours ago
          const lastPickDate = new Date(lastPick[0].createdAt)
          if (lastPickDate < twentyFourHoursAgo) {
            shouldCancel = true
          }
        }

        if (shouldCancel) {
          // Update the draft state to canceled
          await db
            .update(draftsInDa)
            .set({ draftState: 'canceled' })
            .where(eq(draftsInDa.id, draft.id))

          // Clear the join code
          await clearJoinCode(draft.id)

          canceledCount++
        }
      } catch (error) {
        console.error(`Failed to check untimed draft ${draft.guid}:`, error)
      }
    }

    return new Response(`Canceled ${canceledCount} old/inactive drafts`, {
      status: 200
    })
  } catch (error) {
    console.error('Error in cancel-old-drafts cron job:', error)
    return new Response('Error canceling old drafts', { status: 500 })
  }
}
