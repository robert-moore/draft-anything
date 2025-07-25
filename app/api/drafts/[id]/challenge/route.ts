import {
  draftChallengesInDa,
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { getUtcNow } from '@/lib/time-utils'
import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate draft GUID first
    const guidResult = await parseDraftGuid({ params })
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Get the draft and verify it's active
    const draft = await getDraftByGuid(draftGuid)
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Try authenticated user or guest
    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    if (!userOrGuest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = { id: userOrGuest.id }

    if (
      draft.draftState !== 'active' &&
      draft.draftState !== 'challenge_window'
    ) {
      return NextResponse.json(
        { error: 'Draft not found or not active' },
        { status: 400 }
      )
    }

    // Get the most recent pick (highest pick number)
    const lastPick = await db
      .select()
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draft.id))
      .orderBy(desc(draftSelectionsInDa.pickNumber))
      .limit(1)

    if (!lastPick.length) {
      return NextResponse.json(
        { error: 'No picks to challenge' },
        { status: 400 }
      )
    }

    const pickToChallenge = lastPick[0]

    // Get the current user's position in this draft
    const [currentUserPosition] = await db
      .select({ position: draftUsersInDa.position })
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
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
          eq(draftChallengesInDa.draftId, draft.id),
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
    if (!draft.id) {
      return NextResponse.json(
        { error: 'Invalid draft state' },
        { status: 500 }
      )
    }

    const [challenge] = await db
      .insert(draftChallengesInDa)
      .values({
        draftId: Number(draft.id),
        challengedPickNumber: pickToChallenge.pickNumber,
        challengedUserId: pickToChallenge.userId,
        challengerUserId: user.id,
        status: 'pending',
        createdAt: getUtcNow()
      })
      .returning()

    // Update draft state to challenge
    await db
      .update(draftsInDa)
      .set({ draftState: 'challenge' })
      .where(eq(draftsInDa.id, draft.id))

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
    // Validate draft GUID first
    const guidResult = await parseDraftGuid({ params })
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Get the draft
    const draft = await getDraftByGuid(draftGuid)
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Try authenticated user or guest (but don't require authentication for viewing)
    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    // Note: We don't require authentication to view challenge details

    // Get active challenge for this draft
    const challenge = await db
      .select()
      .from(draftChallengesInDa)
      .where(
        and(
          eq(draftChallengesInDa.draftId, draft.id),
          eq(draftChallengesInDa.status, 'pending')
        )
      )
      .limit(1)

    if (!challenge.length) {
      return NextResponse.json({ challenge: null })
    }

    // Get the challenger's name
    const [challenger] = await db
      .select({ name: draftUsersInDa.draftUsername })
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, challenge[0].challengerUserId)
        )
      )
      .limit(1)

    // Get the challenged user's name
    const [challengedUser] = await db
      .select({ name: draftUsersInDa.draftUsername })
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, challenge[0].challengedUserId)
        )
      )
      .limit(1)

    const challengeWithNames = {
      ...challenge[0],
      challengerName: challenger?.name || 'Unknown',
      challengedUserName: challengedUser?.name || 'Unknown'
    }

    return NextResponse.json({ challenge: challengeWithNames })
  } catch (error) {
    console.error('Challenge retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve challenge' },
      { status: 500 }
    )
  }
}
