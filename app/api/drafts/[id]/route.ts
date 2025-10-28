import {
  draftChallengesInDa,
  draftCuratedOptionsInDa,
  draftReactionsInDa,
  draftSelectionsInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate draft GUID
    const guidResult = await parseDraftGuid({ params })
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Get draft details by GUID
    const draft = await getDraftByGuid(draftGuid)

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Check authentication (user or guest) - but allow viewing even if not joined
    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    // Note: We don't require authentication to view draft details
    // The userOrGuest can be null for unauthenticated viewers

    // Check if user is admin (either joined user/guest or guest who created the draft)
    let isAdmin = userOrGuest && draft?.adminUserId === userOrGuest.id

    // If not admin via joined user, check if guest client ID matches admin
    if (!isAdmin) {
      const clientId = request.headers.get('x-client-id')
      if (clientId && draft?.adminUserId === clientId) {
        isAdmin = true
      }
    }

    // For drafts in setting_up state, allow viewing without authentication
    // This allows users to see the draft before joining
    if (draft.draftState === 'setting_up') {
      // Allow viewing even if not authenticated
    }

    // Get participants (both users and guests)
    const participantsQuery = await db
      .select({
        id: draftUsersInDa.userId,
        name: draftUsersInDa.draftUsername,
        position: draftUsersInDa.position,
        isReady: draftUsersInDa.isReady,
        isGuest: draftUsersInDa.isGuest,
        createdAt: draftUsersInDa.createdAt
      })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draft.id))

    // Get draft picks with user names in a single query
    const picksQuery = await db
      .select({
        pickNumber: draftSelectionsInDa.pickNumber,
        userId: draftSelectionsInDa.userId,
        payload: draftSelectionsInDa.payload,
        createdAt: draftSelectionsInDa.createdAt,
        userName: draftUsersInDa.draftUsername,
        wasAutoPick: draftSelectionsInDa.wasAutoPick,
        timeTakenSeconds: draftSelectionsInDa.timeTakenSeconds,
        curatedOptionId: draftSelectionsInDa.curatedOptionId
      })
      .from(draftSelectionsInDa)
      .innerJoin(
        draftUsersInDa,
        eq(draftSelectionsInDa.userId, draftUsersInDa.userId)
      )
      .where(
        and(
          eq(draftSelectionsInDa.draftId, draft.id),
          eq(draftUsersInDa.draftId, draft.id)
        )
      )

    // Get curated options if draft is not freeform
    let curatedOptions: Array<{
      id: number
      optionText: string
      isUsed: boolean
    }> = []
    if (!draft.isFreeform) {
      curatedOptions = await db
        .select({
          id: draftCuratedOptionsInDa.id,
          optionText: draftCuratedOptionsInDa.optionText,
          isUsed: draftCuratedOptionsInDa.isUsed
        })
        .from(draftCuratedOptionsInDa)
        .where(eq(draftCuratedOptionsInDa.draftId, draft.id))
    }

    // Get the latest resolved challenge (if any)
    const latestResolvedChallenge = await db
      .select({
        id: draftChallengesInDa.id,
        resolvedAt: draftChallengesInDa.resolvedAt,
        status: draftChallengesInDa.status
      })
      .from(draftChallengesInDa)
      .where(
        and(
          eq(draftChallengesInDa.draftId, draft.id),
          eq(draftChallengesInDa.status, 'resolved')
        )
      )
      .orderBy(desc(draftChallengesInDa.resolvedAt))
      .limit(1)

    // Also get the latest dismissed challenge
    const latestDismissedChallenge = await db
      .select({
        id: draftChallengesInDa.id,
        resolvedAt: draftChallengesInDa.resolvedAt,
        status: draftChallengesInDa.status
      })
      .from(draftChallengesInDa)
      .where(
        and(
          eq(draftChallengesInDa.draftId, draft.id),
          eq(draftChallengesInDa.status, 'dismissed')
        )
      )
      .orderBy(desc(draftChallengesInDa.resolvedAt))
      .limit(1)

    // Use the most recent of either resolved or dismissed
    const latestChallenge =
      latestResolvedChallenge[0]?.resolvedAt &&
      latestDismissedChallenge[0]?.resolvedAt
        ? latestResolvedChallenge[0].resolvedAt >
          latestDismissedChallenge[0].resolvedAt
          ? latestResolvedChallenge[0]
          : latestDismissedChallenge[0]
        : latestResolvedChallenge[0] || latestDismissedChallenge[0]

    // Transform picks to include clientId and clientName for backward compatibility
    const picks = picksQuery.map(pick => {
      // For curated options, resolve the option text
      let finalPayload = pick.payload
      if (pick.curatedOptionId && !pick.payload) {
        const curatedOption = curatedOptions.find(
          option => option.id === pick.curatedOptionId
        )
        if (curatedOption) {
          finalPayload = curatedOption.optionText
        }
      }

      return {
        pickNumber: pick.pickNumber,
        userId: pick.userId,
        payload: finalPayload,
        createdAt: pick.createdAt,
        clientId: pick.userId, // For backward compatibility
        clientName: pick.userName || 'Unknown',
        wasAutoPick: pick.wasAutoPick,
        timeTakenSeconds: pick.timeTakenSeconds
      }
    })

    // Find the highest pick number
    const sortedPicks = picksQuery.sort((a, b) => b.pickNumber - a.pickNumber)
    const highestPickNumber = sortedPicks[0]?.pickNumber || 0
    let hasPreviousPickAlreadyBeenChallenged = false

    if (highestPickNumber > 0) {
      // Only hide challenge button if there's an active challenge for the current pick
      const currentPickChallenges = await db
        .select({ id: draftChallengesInDa.id })
        .from(draftChallengesInDa)
        .where(
          and(
            eq(draftChallengesInDa.draftId, draft.id),
            eq(draftChallengesInDa.challengedPickNumber, highestPickNumber)
          )
        )
        .limit(1)

      if (currentPickChallenges.length > 0) {
        hasPreviousPickAlreadyBeenChallenged = true
      }
    }

    // Get all reactions for the draft
    const reactions = await db
      .select()
      .from(draftReactionsInDa)
      .where(eq(draftReactionsInDa.draftId, draft.id))

    return NextResponse.json({
      draft,
      participants: participantsQuery,
      picks: picks.sort((a, b) => a.pickNumber - b.pickNumber),
      currentUser: userOrGuest
        ? { id: userOrGuest.id, type: userOrGuest.type }
        : null,
      isAdmin,
      curatedOptions,
      latestResolvedChallenge: latestChallenge || null,
      hasPreviousPickAlreadyBeenChallenged,
      reactions
    })
  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
