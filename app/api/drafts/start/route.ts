import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, draftId } = await req.json()

    if (!userId || !draftId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))
      .limit(1)

    if (!draft || draft.adminUserId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await db
      .update(draftsInDa)
      .set({ draftState: 'active' })
      .where(eq(draftsInDa.id, draftId))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
