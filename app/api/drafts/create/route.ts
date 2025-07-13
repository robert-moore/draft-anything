import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { adminUserId, name, maxDrafters, secPerRound, numRounds } = body

    if (!adminUserId || !name || !maxDrafters || !secPerRound || !numRounds) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const [newDraft] = await db
      .insert(draftsInDa)
      .values({
        adminUserId,
        name,
        draftState: 'setting_up',
        maxDrafters,
        secPerRound,
        numRounds,
        createdAt: new Date().toISOString()
      })
      .returning()

    return NextResponse.json({ draft: newDraft }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
