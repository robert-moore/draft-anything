import {
  draftChallengesInDa,
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const draftId = parseInt(resolvedParams.id)
    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 })
    }

    // Get the draft and verify it's active
    const draft = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))
      .limit(1)

    if (!draft.length || draft[0].draftState !== 'active') {
      return NextResponse.json(
        { error: 'Draft not found or not active' },
        { status: 400 }
      )
    }

    // Get the most recent pick
    const lastPick = await db
      .select()
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draftId))
      .orderBy(draftSelectionsInDa.pickNumber)
      .limit(1)

    if (!lastPick.length) {
      return NextResponse.json(
        { error: 'No picks to challenge' },
        { status: 400 }
      )
    }

    const pickToChallenge = lastPick[0]

    // Debug logging
    console.log('Challenge debug:', {
      currentUserId: user.id,
      lastPickUserId: pickToChallenge.userId,
      lastPickNumber: pickToChallenge.pickNumber,
      lastPickPayload: pickToChallenge.payload,
      isOwnPick: pickToChallenge.userId === user.id
    })

    // Get the current user's position in this draft
    const [currentUserPosition] = await db
      .select({ position: draftUsersInDa.position })
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draftId),
          eq(draftUsersInDa.userId, user.id)
        )
      )
      .limit(1)

    if (!currentUserPosition) {
      return NextResponse.json(
        { error: 'You are not a participant in this draft' },
        { status: 400 }
      )
    }

    // Verify the challenger didn't make the pick they're challenging
    if (pickToChallenge.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot challenge your own pick' },
        { status: 400 }
      )
    }

    // Check if there's already an active challenge
    const existingChallenge = await db
      .select()
      .from(draftChallengesInDa)
      .where(
        and(
          eq(draftChallengesInDa.draftId, draftId),
          eq(draftChallengesInDa.status, 'pending')
        )
      )
      .limit(1)

    if (existingChallenge.length > 0) {
      return NextResponse.json(
        { error: 'Challenge already in progress' },
        { status: 400 }
      )
    }

    // Create the challenge
    const [challenge] = await db
      .insert(draftChallengesInDa)
      .values({
        draftId,
        challengedPickNumber: pickToChallenge.pickNumber,
        challengedUserId: pickToChallenge.userId,
        challengerUserId: user.id,
        status: 'pending'
      })
      .returning()

    // Update draft state to challenge
    await db
      .update(draftsInDa)
      .set({ draftState: 'challenge' })
      .where(eq(draftsInDa.id, draftId))

    return NextResponse.json({ challenge })
  } catch (error) {
    console.error('Challenge creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const draftId = parseInt(resolvedParams.id)
    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 })
    }

    // Get active challenge for this draft
    const challenge = await db
      .select()
      .from(draftChallengesInDa)
      .where(
        and(
          eq(draftChallengesInDa.draftId, draftId),
          eq(draftChallengesInDa.status, 'pending')
        )
      )
      .limit(1)

    if (!challenge.length) {
      return NextResponse.json({ challenge: null })
    }

    return NextResponse.json({ challenge: challenge[0] })
  } catch (error) {
    console.error('Challenge retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve challenge' },
      { status: 500 }
    )
  }
}
