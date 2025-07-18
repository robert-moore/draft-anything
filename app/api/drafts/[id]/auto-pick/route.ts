import {
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa,
  profilesInDa
} from '@/drizzle/schema'
import { db } from '@/lib/db'
import { getElapsedSeconds, getUtcNow } from '@/lib/time-utils'
import { parseJsonRequest } from '@/lib/api/validation'
import { parseDraftId } from '@/lib/api/route-helpers'
import { and, count, eq } from 'drizzle-orm'
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

    // Count existing picks first
    const [pickCountResult] = await db
      .select({ count: count() })
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draftId))

    const currentPickNumber = pickCountResult.count + 1

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

    // Get all previous picks
    const previousPicks = await db
      .select({ payload: draftSelectionsInDa.payload })
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draftId))

    const usedPayloads = previousPicks.map(p => p.payload.toLowerCase())

    // Generate auto-pick payload
    const autoPickPayload = generateAutoPick(usedPayloads, draft.name)

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

    // Reset timer for next player if draft continues
    if (nextPosition !== null && secPerRound > 0) {
      updates.turnStartedAt = getUtcNow()
    }

    await db.update(draftsInDa).set(updates).where(eq(draftsInDa.id, draftId))

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

function generateAutoPick(usedPayloads: string[], draftName: string): string {
  // Generate contextual auto-picks based on draft theme
  const theme = draftName.toLowerCase()

  // Common default picks for different themes
  const themePicks: Record<string, string[]> = {
    restaurant: [
      'Pizza Place',
      'Burger Joint',
      'Sushi Bar',
      'Taco Stand',
      'Italian Restaurant'
    ],
    movie: ['Action Movie', 'Comedy Film', 'Drama', 'Thriller', 'Documentary'],
    sport: ['Basketball', 'Football', 'Baseball', 'Soccer', 'Tennis'],
    music: ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop'],
    game: [
      'Board Game',
      'Video Game',
      'Card Game',
      'Sports Game',
      'Puzzle Game'
    ]
  }

  // Find matching theme
  let candidates: string[] = []
  for (const [key, values] of Object.entries(themePicks)) {
    if (theme.includes(key)) {
      candidates = values
      break
    }
  }

  // If no theme match, use generic picks
  if (candidates.length === 0) {
    candidates = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
  }

  // Find first unused pick
  for (const candidate of candidates) {
    if (!usedPayloads.includes(candidate.toLowerCase())) {
      return candidate
    }
  }

  // Fallback: generate unique pick
  let counter = 1
  while (true) {
    const pick = `Auto-Pick #${counter}`
    if (!usedPayloads.includes(pick.toLowerCase())) {
      return pick
    }
    counter++
  }
}
