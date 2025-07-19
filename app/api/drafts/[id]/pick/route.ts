import { draftSelectionsInDa, profilesInDa } from '@/drizzle/schema'
import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import {
  calculateNextDrafter,
  getCurrentPickNumberByGuid,
  getParticipantCountByGuid,
  updateDraftAfterPickByGuid,
  validateAndFetchDraftByGuid,
  verifyParticipantByGuid
} from '@/lib/api/draft-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { getElapsedSeconds, getUtcNow } from '@/lib/time-utils'
import { eq } from 'drizzle-orm'
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
    // Validate draft GUID
    const guidResult = await parseDraftGuid(context)
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

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

    // Validate and fetch draft
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return draftResult.error
    const { draft } = draftResult

    // Verify participant
    const participantResult = await verifyParticipantByGuid(draftGuid, user.id)
    if (!participantResult.success) return participantResult.error
    const { position } = participantResult

    // Enforce turn
    if (position !== draft.currentPositionOnClock) {
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

    // Get current pick number
    const currentPickNumber = await getCurrentPickNumberByGuid(draftGuid)

    // Insert the pick
    const now = getUtcNow()
    await db.insert(draftSelectionsInDa).values({
      draftId: draft.id,
      userId: user.id,
      pickNumber: currentPickNumber,
      payload: payload,
      createdAt: now,
      wasAutoPick: false,
      timeTakenSeconds: timeTakenSeconds?.toString() || null
    })

    // Get participant count and calculate next drafter
    const numParticipants = await getParticipantCountByGuid(draftGuid)
    const { nextPosition, isDraftCompleted } = calculateNextDrafter(
      currentPickNumber,
      numParticipants,
      draft.numRounds
    )

    // Update draft state (always reset timer for next player)
    await updateDraftAfterPickByGuid(
      draftGuid,
      nextPosition,
      isDraftCompleted,
      true
    )

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
