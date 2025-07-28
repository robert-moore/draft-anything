import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { clearJoinCode } from '@/lib/utils/join-code'
import { and, eq, lt } from 'drizzle-orm'

export async function GET() {
  try {
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

    let canceledCount = 0

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
        console.log(
          `Canceled draft: ${draft.name} (${draft.guid}) - created at ${draft.createdAt}`
        )
      } catch (error) {
        console.error(`Failed to cancel draft ${draft.guid}:`, error)
      }
    }

    console.log(`Cron job complete: Canceled ${canceledCount} old drafts`)
    return new Response(`Canceled ${canceledCount} old drafts`, { status: 200 })
  } catch (error) {
    console.error('Error in cancel-old-drafts cron job:', error)
    return new Response('Error canceling old drafts', { status: 500 })
  }
}
