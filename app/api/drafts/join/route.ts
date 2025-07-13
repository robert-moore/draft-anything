import { draftUsersInDa, draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, draftId } = body

    if (!userId || !draftId) {
      console.warn('Missing fields:', { userId, draftId })
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Check if already joined
    const existing = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.userId, userId),
          eq(draftUsersInDa.draftId, draftId)
        )
      )

    if (existing.length === 0) {
      await db.insert(draftUsersInDa).values({
        userId,
        draftId,
        position: null,
        isReady: false,
        createdAt: new Date().toISOString()
      })
    }

    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))
      .limit(1)

    const isAdmin = draft?.adminUserId === userId

    return NextResponse.json({ success: true, isAdmin }, { status: 201 })
  } catch (err: any) {
    console.error('❌ Error in /join:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
