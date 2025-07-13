import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const { name, draftState, maxDrafters, secPerRound, numRounds } = body

    if (!name || !maxDrafters || !secPerRound || !numRounds) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const [newDraft] = await db
      .insert(draftsInDa)
      .values({
        name,
        adminUserId: user.id,
        draftState: draftState || 'setting_up',
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

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get all drafts (you might want to add pagination or filtering later)
    const allDrafts = await db.select().from(draftsInDa)

    return NextResponse.json(allDrafts)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}