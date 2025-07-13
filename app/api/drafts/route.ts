import { drafts } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { name, draftState, maxDrafters, secPerRound, numRounds } = body

    if (!name || !draftState || !maxDrafters || !secPerRound || !numRounds) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const [newDraft] = await db
      .insert(drafts)
      .values({
        name,
        draftState,
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
