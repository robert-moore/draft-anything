import {
  draftCuratedOptionsInDa,
  draftSelectionsInDa,
  draftsInDa,
  profilesInDa
} from '@/drizzle/schema'
import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import {
  calculateNextDrafter,
  getCurrentPickNumberByGuid,
  getParticipantCountByGuid,
  updateDraftAfterPickByGuid,
  validateAndFetchDraftByGuid,
  verifyParticipantByGuid
} from '@/lib/api/draft-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { db } from '@/lib/db'
import { getElapsedSeconds, getUtcNow } from '@/lib/time-utils'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for making a pick
const makePickSchema = z
  .object({
    payload: z.string().optional(),
    curatedOptionId: z.number().optional()
  })
  .refine(data => data.payload || data.curatedOptionId, {
    message: 'Either payload or curatedOptionId must be provided'
  })

// Schema for making a pick (with internal autopick support)
const makePickSchemaWithInternal = z
  .object({
    payload: z.string().optional(),
    curatedOptionId: z.number().optional(),
    wasAutoPick: z.boolean().optional(),
    userId: z.string().optional()
  })
  .refine(data => data.payload || data.curatedOptionId, {
    message: 'Either payload or curatedOptionId must be provided'
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

    // Validate and fetch draft first
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return draftResult.error
    const { draft } = draftResult

    // --- Internal auto-pick support ---
    const secret = process.env.INTERNAL_AUTOPICK_SECRET
    const internalSecret = request.headers.get('x-internal-autopick-secret')
    let user = null
    let isInternalAutoPick = false
    let wasAutoPick = false
    let userIdFromBody = null

    // Validate request body (early, so we can get userId if internal)
    const bodyResult = await parseJsonRequest(
      request,
      makePickSchemaWithInternal
    )
    if (!bodyResult.success) return bodyResult.error
    const {
      payload,
      curatedOptionId,
      wasAutoPick: wasAutoPickBody,
      userId
    } = bodyResult.data as z.infer<typeof makePickSchemaWithInternal>

    if (secret && internalSecret && internalSecret === secret) {
      // Internal auto-pick call
      isInternalAutoPick = true
      wasAutoPick = wasAutoPickBody ?? true
      userIdFromBody = userId
      if (!userIdFromBody) {
        return NextResponse.json(
          { error: 'Internal auto-pick missing userId' },
          { status: 400 }
        )
      }
      user = { id: userIdFromBody }
    } else {
      // Normal authentication - try authenticated user or guest
      const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
      if (!userOrGuest) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      user = { id: userOrGuest.id }
      wasAutoPick = false
    }

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
      // Skip timer check for internal auto-pick calls
      if (!isInternalAutoPick && timeTakenSeconds > secPerRound + 1) {
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

    // Validate curated option if provided
    if (curatedOptionId) {
      const [curatedOption] = await db
        .select()
        .from(draftCuratedOptionsInDa)
        .where(eq(draftCuratedOptionsInDa.id, curatedOptionId))

      if (!curatedOption) {
        return NextResponse.json(
          { error: 'Invalid curated option ID' },
          { status: 400 }
        )
      }

      if (curatedOption.isUsed) {
        return NextResponse.json(
          { error: 'This option has already been selected' },
          { status: 400 }
        )
      }

      // Mark the option as used
      await db
        .update(draftCuratedOptionsInDa)
        .set({ isUsed: true })
        .where(eq(draftCuratedOptionsInDa.id, curatedOptionId))
    }

    // Insert the pick
    const now = getUtcNow()
    await db.insert(draftSelectionsInDa).values({
      draftId: draft.id,
      userId: user.id,
      pickNumber: currentPickNumber,
      payload: payload || null,
      curatedOptionId: curatedOptionId || null,
      createdAt: now,
      wasAutoPick,
      timeTakenSeconds: timeTakenSeconds?.toString() || null
    })

    // Get participant count and calculate next drafter
    const numParticipants = await getParticipantCountByGuid(draftGuid)
    const { nextPosition, isDraftCompleted } = calculateNextDrafter(
      currentPickNumber,
      numParticipants,
      draft.numRounds
    )

    // Check if this is the last pick and we should enter challenge window
    // Only freeform drafts enter challenge window - curated drafts complete immediately
    const shouldEnterChallengeWindow = isDraftCompleted && draft.isFreeform

    // Update draft state
    if (shouldEnterChallengeWindow) {
      // Enter challenge window instead of completing immediately
      await db
        .update(draftsInDa)
        .set({
          currentPositionOnClock: null,
          draftState: 'challenge_window',
          turnStartedAt: getUtcNow() // Use this to track challenge window start time
        })
        .where(eq(draftsInDa.guid, draftGuid))
    } else {
      // Normal pick flow
      await updateDraftAfterPickByGuid(
        draftGuid,
        nextPosition,
        isDraftCompleted,
        true
      )
    }

    // Get profile name
    const [profile] = await db
      .select({ name: profilesInDa.name })
      .from(profilesInDa)
      .where(eq(profilesInDa.id, user.id))

    // Get curated option text if applicable
    let finalPayload = payload
    if (curatedOptionId) {
      const [curatedOption] = await db
        .select({ optionText: draftCuratedOptionsInDa.optionText })
        .from(draftCuratedOptionsInDa)
        .where(eq(draftCuratedOptionsInDa.id, curatedOptionId))
      finalPayload = curatedOption?.optionText || payload
    }

    return NextResponse.json(
      {
        pickNumber: currentPickNumber,
        userId: user.id,
        clientId: user.id,
        clientName: profile?.name || 'Unknown',
        payload: finalPayload,
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
