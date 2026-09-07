import {
  draftCuratedOptionsInDa,
  draftSelectionsInDa,
  draftsInDa
} from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import {
  calculateNextDrafter,
  getParticipantCount
} from '@/lib/api/draft-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { db } from '@/lib/db'
import {
  EXTEND_WINDOW_MS,
  MAX_CURATED_OPTIONS,
  MAX_EXTRA_ROUNDS,
  MAX_OPTION_LENGTH,
  MAX_TOTAL_ROUNDS,
  MIN_EXTRA_ROUNDS,
  extraPicksNeeded,
  isWithinExtendWindow,
  parseCuratedOptionLines
} from '@/lib/draft-extend'
import { getUtcNow } from '@/lib/time-utils'
import { and, count, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const extendDraftSchema = z.object({
  extraRounds: z
    .number()
    .int()
    .min(MIN_EXTRA_ROUNDS)
    .max(MAX_EXTRA_ROUNDS),
  additionalOptions: z.string().max(50000).optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guidResult = await parseDraftGuid({ params })
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    const draft = await getDraftByGuid(draftGuid)
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    if (!userOrGuest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (draft.adminUserId !== userOrGuest.id) {
      return NextResponse.json(
        { error: 'Only the draft admin can extend the draft' },
        { status: 403 }
      )
    }

    if (draft.draftState !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed drafts can be extended' },
        { status: 400 }
      )
    }

    const bodyResult = await parseJsonRequest(request, extendDraftSchema)
    if (!bodyResult.success) return bodyResult.error
    const { extraRounds, additionalOptions } = bodyResult.data

    const [lastPick] = await db
      .select({
        pickNumber: draftSelectionsInDa.pickNumber,
        createdAt: draftSelectionsInDa.createdAt
      })
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draft.id))
      .orderBy(desc(draftSelectionsInDa.pickNumber))
      .limit(1)

    if (!lastPick) {
      return NextResponse.json(
        { error: 'Draft has no picks to extend from' },
        { status: 400 }
      )
    }

    if (!isWithinExtendWindow(lastPick.createdAt)) {
      return NextResponse.json(
        {
          error: `Drafts can only be extended within ${
            EXTEND_WINDOW_MS / (60 * 60 * 1000)
          } hours of the last pick`
        },
        { status: 400 }
      )
    }

    const newNumRounds = draft.numRounds + extraRounds
    if (newNumRounds > MAX_TOTAL_ROUNDS) {
      return NextResponse.json(
        {
          error: `Cannot exceed ${MAX_TOTAL_ROUNDS} total rounds (currently ${draft.numRounds})`
        },
        { status: 400 }
      )
    }

    const participantCount = await getParticipantCount(draft.id)
    if (participantCount < 2) {
      return NextResponse.json(
        { error: 'At least 2 participants are required to extend' },
        { status: 400 }
      )
    }

    const additionalOptionLines = draft.isFreeform
      ? []
      : parseCuratedOptionLines(additionalOptions)

    if (!draft.isFreeform) {
      const longOption = additionalOptionLines.find(
        option => option.length > MAX_OPTION_LENGTH
      )
      if (longOption) {
        return NextResponse.json(
          {
            error: `Each option must be ${MAX_OPTION_LENGTH} characters or less`
          },
          { status: 400 }
        )
      }

      const [unusedResult] = await db
        .select({ count: count() })
        .from(draftCuratedOptionsInDa)
        .where(
          and(
            eq(draftCuratedOptionsInDa.draftId, draft.id),
            eq(draftCuratedOptionsInDa.isUsed, false)
          )
        )

      const [totalOptionsResult] = await db
        .select({ count: count() })
        .from(draftCuratedOptionsInDa)
        .where(eq(draftCuratedOptionsInDa.draftId, draft.id))

      const unusedCount = unusedResult.count
      const totalAfterInsert =
        totalOptionsResult.count + additionalOptionLines.length

      if (totalAfterInsert > MAX_CURATED_OPTIONS) {
        return NextResponse.json(
          {
            error: `Maximum ${MAX_CURATED_OPTIONS} curated options allowed`
          },
          { status: 400 }
        )
      }

      const needed = extraPicksNeeded(extraRounds, participantCount)
      const available = unusedCount + additionalOptionLines.length
      if (available < needed) {
        return NextResponse.json(
          {
            error: `Not enough unused options. Adding ${extraRounds} round${
              extraRounds === 1 ? '' : 's'
            } needs ${needed} options for ${participantCount} players, but only ${available} unused option${
              available === 1 ? '' : 's'
            } ${additionalOptionLines.length > 0 ? '(including newly added) ' : ''}remain.`
          },
          { status: 400 }
        )
      }
    }

    if (additionalOptionLines.length > 0) {
      await db.insert(draftCuratedOptionsInDa).values(
        additionalOptionLines.map(optionText => ({
          draftId: draft.id,
          optionText,
          createdAt: getUtcNow()
        }))
      )
    }

    const { nextPosition, isDraftCompleted } = calculateNextDrafter(
      lastPick.pickNumber,
      participantCount,
      newNumRounds
    )

    if (isDraftCompleted || nextPosition === null) {
      return NextResponse.json(
        { error: 'Could not continue the snake with the requested rounds' },
        { status: 400 }
      )
    }

    await db
      .update(draftsInDa)
      .set({
        numRounds: newNumRounds,
        draftState: 'active',
        currentPositionOnClock: nextPosition,
        turnStartedAt: getUtcNow()
      })
      .where(eq(draftsInDa.id, draft.id))

    return NextResponse.json({
      message: 'Draft extended',
      numRounds: newNumRounds,
      extraRounds,
      currentPositionOnClock: nextPosition,
      draftState: 'active'
    })
  } catch (error) {
    console.error('Error extending draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
