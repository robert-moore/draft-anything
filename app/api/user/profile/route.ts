import {
  draftReactionsInDa,
  draftSelectionsInDa,
  draftsInDa
} from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, desc, eq, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all drafts where user is a participant (either as admin or as a joined user)
    const userDrafts = await db
      .select({
        id: draftsInDa.id,
        guid: draftsInDa.guid,
        name: draftsInDa.name,
        createdAt: draftsInDa.createdAt,
        draftState: draftsInDa.draftState
      })
      .from(draftsInDa)
      .where(
        sql`${draftsInDa.id} IN (
          SELECT DISTINCT draft_id 
          FROM da.draft_users 
          WHERE user_id = ${user.id}
        ) OR ${draftsInDa.adminUserId} = ${user.id}`
      )
      .orderBy(desc(draftsInDa.createdAt))
      .limit(250)

    // Get user's top 5 most used emoji reactions
    const userEmojiReactions = await db
      .select({
        emoji: draftReactionsInDa.emoji,
        count: sql<number>`count(*)`
      })
      .from(draftReactionsInDa)
      .where(
        and(
          eq(draftReactionsInDa.userId, user.id),
          sql`${draftReactionsInDa.emoji} IS NOT NULL`
        )
      )
      .groupBy(draftReactionsInDa.emoji)
      .orderBy(desc(sql`count(*)`))
      .limit(5)

    // Get top 5 most used emoji reactions on user's selections
    const userSelectionEmojiReactions = await db
      .select({
        emoji: draftReactionsInDa.emoji,
        count: sql<number>`count(*)`
      })
      .from(draftReactionsInDa)
      .innerJoin(
        draftSelectionsInDa,
        and(
          eq(draftReactionsInDa.draftId, draftSelectionsInDa.draftId),
          eq(draftReactionsInDa.pickNumber, draftSelectionsInDa.pickNumber)
        )
      )
      .where(
        and(
          eq(draftSelectionsInDa.userId, user.id),
          sql`${draftReactionsInDa.emoji} IS NOT NULL`
        )
      )
      .groupBy(draftReactionsInDa.emoji)
      .orderBy(desc(sql`count(*)`))
      .limit(5)

    return NextResponse.json({
      drafts: userDrafts,
      userEmojiReactions: userEmojiReactions.map(r => ({
        emoji: r.emoji,
        count: Number(r.count)
      })),
      userSelectionEmojiReactions: userSelectionEmojiReactions.map(r => ({
        emoji: r.emoji,
        count: Number(r.count)
      }))
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
