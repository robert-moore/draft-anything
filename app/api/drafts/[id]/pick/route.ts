import {
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa,
  profilesInDa
} from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const draftId = parseInt(id)

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { payload } = body

    if (
      !payload ||
      typeof payload !== 'string' ||
      payload.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Pick content is required' },
        { status: 400 }
      )
    }

    // Fetch draft
    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.draftState !== 'active') {
      return NextResponse.json(
        { error: 'Draft is not active' },
        { status: 400 }
      )
    }

    // Verify participant
    const [participant] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draftId),
          eq(draftUsersInDa.userId, user.id)
        )
      )

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this draft' },
        { status: 403 }
      )
    }

    // Enforce turn
    if (participant.position !== draft.currentPositionOnClock) {
      return NextResponse.json(
        {
          error: `It's not your turn. Player with position ${draft.currentPositionOnClock} is on the clock.`
        },
        { status: 403 }
      )
    }

    // Count existing picks
    const [pickCountResult] = await db
      .select({ count: count() })
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draftId))

    const currentPickNumber = pickCountResult.count + 1

    // Insert the pick
    const now = new Date().toISOString()
    await db.insert(draftSelectionsInDa).values({
      draftId,
      userId: user.id,
      pickNumber: currentPickNumber,
      payload: payload.trim(),
      createdAt: now
    })

    // Get number of participants
    const [countResult] = await db
      .select({ count: count() })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draftId))

    const numParticipants = countResult.count
    const totalPicks = draft.numRounds * numParticipants

    // Calculate next drafter
    const nextPickNumber = currentPickNumber + 1
    const nextRound = Math.ceil(nextPickNumber / numParticipants)
    const nextPickInRound = (nextPickNumber - 1) % numParticipants

    const nextPosition =
      nextPickNumber > totalPicks
        ? null
        : nextRound % 2 === 1
        ? nextPickInRound + 1 // 1-based
        : numParticipants - nextPickInRound

    // Update draft state
    await db
      .update(draftsInDa)
      .set({
        currentPositionOnClock: nextPosition,
        draftState: nextPickNumber > totalPicks ? 'completed' : draft.draftState
      })
      .where(eq(draftsInDa.id, draftId))

    // Get profile name
    const [profile] = await db
      .select({ name: profilesInDa.name })
      .from(profilesInDa)
      .where(eq(profilesInDa.id, user.id))

    return NextResponse.json(
      {
        pickNumber: currentPickNumber,
        userId: user.id,
        clientId: user.id,
        clientName: profile?.name || 'Unknown',
        payload: payload.trim(),
        createdAt: now
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error making pick:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
