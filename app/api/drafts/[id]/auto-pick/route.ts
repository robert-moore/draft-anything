import {
  draftSelectionsInDa,
  draftUsersInDa,
  profilesInDa
} from '@/drizzle/schema'
import {
  calculateNextDrafter,
  getCurrentPickNumber,
  getParticipantCount,
  getUsedPayloads,
  updateDraftAfterPick,
  validateAndFetchDraft
} from '@/lib/api/draft-helpers'
import { parseDraftId } from '@/lib/api/route-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { db } from '@/lib/db'
import { getElapsedSeconds, getUtcNow } from '@/lib/time-utils'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for auto-pick request
const autoPickSchema = z.object({
  expectedPickNumber: z.number().int().positive().optional()
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

    // Validate request body
    const bodyResult = await parseJsonRequest(request, autoPickSchema)
    if (!bodyResult.success) return bodyResult.error
    const { expectedPickNumber } = bodyResult.data

    // Validate and fetch draft
    const draftResult = await validateAndFetchDraft(draftId)
    if (!draftResult.success) return draftResult.error
    const { draft } = draftResult

    // Check if timer is enabled and expired
    const secPerRound = parseInt(draft.secPerRound)
    if (secPerRound === 0 || !draft.turnStartedAt || draft.timerPaused) {
      return NextResponse.json(
        { error: 'Timer is not enabled or is paused' },
        { status: 400 }
      )
    }

    const elapsedSeconds = getElapsedSeconds(draft.turnStartedAt)

    // Allow auto-pick if time is up or within 1 second of expiring (to handle race conditions)
    if (elapsedSeconds < secPerRound - 1) {
      return NextResponse.json(
        {
          error: `Timer has not expired. ${
            secPerRound - elapsedSeconds
          } seconds remaining.`
        },
        { status: 400 }
      )
    }

    // Get current player on the clock
    if (!draft.currentPositionOnClock) {
      return NextResponse.json(
        { error: 'No player is currently on the clock' },
        { status: 400 }
      )
    }

    const [currentPlayer] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draftId),
          eq(draftUsersInDa.position, draft.currentPositionOnClock)
        )
      )

    if (!currentPlayer || !currentPlayer.userId) {
      return NextResponse.json(
        { error: 'Current player not found' },
        { status: 404 }
      )
    }

    // Get current pick number
    const currentPickNumber = await getCurrentPickNumber(draftId)

    // Check if the expected pick number matches (if provided)
    if (expectedPickNumber && expectedPickNumber < currentPickNumber) {
      // Pick was already made by another client
      return NextResponse.json(
        {
          message: 'Auto-pick already completed',
          pickNumber: currentPickNumber - 1
        },
        { status: 200 }
      )
    }

    // Get used payloads and generate auto-pick
    const usedPayloads = await getUsedPayloads(draftId)
    const autoPickPayload = generateAutoPick(usedPayloads)

    // Insert the auto-pick - database will enforce unique constraint on pickNumber
    const nowStr = getUtcNow()
    try {
      await db.insert(draftSelectionsInDa).values({
        draftId,
        userId: currentPlayer.userId,
        pickNumber: currentPickNumber,
        payload: autoPickPayload,
        createdAt: nowStr,
        wasAutoPick: true,
        timeTakenSeconds: elapsedSeconds.toString()
      })
    } catch (insertError: any) {
      // If insert fails due to duplicate, another client already made the pick
      if (
        insertError.code === '23505' ||
        insertError.message?.includes('duplicate')
      ) {
        return NextResponse.json(
          {
            message: 'Auto-pick already completed',
            pickNumber: currentPickNumber
          },
          { status: 200 }
        )
      }
      throw insertError
    }

    // Get participant count and calculate next drafter
    const numParticipants = await getParticipantCount(draftId)
    const { nextPosition, isDraftCompleted } = calculateNextDrafter(
      currentPickNumber,
      numParticipants,
      draft.numRounds
    )

    // Update draft state
    await updateDraftAfterPick(
      draftId,
      nextPosition,
      isDraftCompleted,
      secPerRound > 0 // only reset timer if timer is enabled
    )

    // Get profile name
    const [profile] = await db
      .select({ name: profilesInDa.name })
      .from(profilesInDa)
      .where(eq(profilesInDa.id, currentPlayer.userId))

    return NextResponse.json(
      {
        pickNumber: currentPickNumber,
        userId: currentPlayer.userId,
        clientId: currentPlayer.userId,
        clientName: profile?.name || 'Unknown',
        payload: autoPickPayload,
        createdAt: nowStr,
        wasAutoPick: true
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error making auto-pick:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateAutoPick(usedPayloads: string[]): string {
  // Generate simple auto-pick with counter
  let counter = 1
  while (true) {
    const pick = `Auto Pick #${counter}`
    if (!usedPayloads.includes(pick.toLowerCase())) {
      return pick
    }
    counter++
  }
}
