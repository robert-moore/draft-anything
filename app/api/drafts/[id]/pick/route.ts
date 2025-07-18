import {
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa,
  profilesInDa
} from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { getElapsedSeconds, getUtcNow } from '@/lib/time-utils'
import { parseJsonRequest } from '@/lib/api/validation'
import { parseDraftId } from '@/lib/api/route-helpers'
import { and, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for making a pick
const makePickSchema = z.object({
  payload: z.string().trim().min(1, 'Pick content is required').max(200)
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate draft ID
    const idResult = await parseDraftId(context)
    if (!idResult.success) return idResult.error
    const { draftId } = idResult

    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate request body
    const bodyResult = await parseJsonRequest(request, makePickSchema)
    if (!bodyResult.success) return bodyResult.error
    const { payload } = bodyResult.data

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

    // Check timer if enabled
    const secPerRound = parseInt(draft.secPerRound)
    let timeTakenSeconds = null

    if (secPerRound > 0 && draft.turnStartedAt && !draft.timerPaused) {
      timeTakenSeconds = getElapsedSeconds(draft.turnStartedAt)

      // Add 1 second grace period to handle network latency
      if (timeTakenSeconds > secPerRound + 1) {
        return NextResponse.json(
          {
            error: `Time expired. You had ${secPerRound} seconds to make your pick.`
          },
          { status: 400 }
        )
      }
    }

    // Count existing picks
    const [pickCountResult] = await db
      .select({ count: count() })
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draftId))

    const currentPickNumber = pickCountResult.count + 1

    // Insert the pick
    const now = getUtcNow()
    await db.insert(draftSelectionsInDa).values({
      draftId,
      userId: user.id,
      pickNumber: currentPickNumber,
      payload: payload,
      createdAt: now,
      wasAutoPick: false,
      timeTakenSeconds: timeTakenSeconds?.toString() || null
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

    // Update draft state and reset timer for next pick
    const updates: any = {
      currentPositionOnClock: nextPosition,
      draftState: nextPickNumber > totalPicks ? 'completed' : draft.draftState
    }

    // Reset timer for next player if draft continues (for both timed and untimed)
    if (nextPosition !== null) {
      updates.turnStartedAt = getUtcNow()
    }

    await db.update(draftsInDa).set(updates).where(eq(draftsInDa.id, draftId))

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
        payload: payload,
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
