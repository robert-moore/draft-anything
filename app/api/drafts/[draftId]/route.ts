import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { draftId: string } }
) {
  try {
    const draftId = Number(params.draftId)

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draftId' }, { status: 400 })
    }

    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))
      .limit(1)

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const { adminUserId, ...publicFields } = draft
    return NextResponse.json({ draft: publicFields }, { status: 200 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  //   TODO fetch drafters
}
