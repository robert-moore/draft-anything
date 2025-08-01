import {
  draftChallengesInDa,
  draftChallengeVotesInDa,
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import {
  calculateNextDrafter,
  getParticipantCountByGuid
} from '@/lib/api/draft-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { clearJoinCode } from '@/lib/utils/join-code'
import { and, count, eq } from 'drizzle-orm'
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

    // Get the draft
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

    const { vote } = await request.json()
    if (typeof vote !== 'boolean') {
      return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 })
    }

    // Get the active challenge
    const [challenge] = await db
      .select()
      .from(draftChallengesInDa)
      .where(
        and(
          eq(draftChallengesInDa.draftId, draft.id),
          eq(draftChallengesInDa.status, 'pending')
        )
      )
      .limit(1)

    if (!challenge) {
      return NextResponse.json(
        { error: 'No active challenge' },
        { status: 400 }
      )
    }

    // Check if user is a participant in this draft
    const [participant] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, user.id)
        )
      )
      .limit(1)

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this draft' },
        { status: 400 }
      )
    }

    // Check if user is the challenged player (they can't vote)
    if (challenge.challengedUserId === user.id) {
      return NextResponse.json(
        { error: 'Challenged player cannot vote' },
        { status: 400 }
      )
    }

    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(draftChallengeVotesInDa)
      .where(
        and(
          eq(draftChallengeVotesInDa.challengeId, challenge.id),
          eq(draftChallengeVotesInDa.voterUserId, user.id)
        )
      )
      .limit(1)

    if (existingVote) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 })
    }

    // Cast the vote
    await db.insert(draftChallengeVotesInDa).values({
      challengeId: challenge.id,
      voterUserId: user.id,
      vote,
      createdAt: new Date().toISOString()
    })

    // Check if we have enough votes to resolve the challenge
    const totalParticipants = await db
      .select({ count: count() })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draft.id))

    const totalVotes = await db
      .select({ count: count() })
      .from(draftChallengeVotesInDa)
      .where(eq(draftChallengeVotesInDa.challengeId, challenge.id))

    const validVotes = await db
      .select({ count: count() })
      .from(draftChallengeVotesInDa)
      .where(
        and(
          eq(draftChallengeVotesInDa.challengeId, challenge.id),
          eq(draftChallengeVotesInDa.vote, true)
        )
      )

    const participantCount = totalParticipants[0].count
    const voteCount = totalVotes[0].count
    const validVoteCount = validVotes[0].count

    // Resolve challenge if we have 50% of eligible voters or all participants voted
    const eligibleVoters = participantCount - 1 // -1 for the challenged player
    const fiftyPercentThreshold = Math.ceil(eligibleVoters / 2)

    if (voteCount >= fiftyPercentThreshold) {
      const isChallengeValid = validVoteCount >= fiftyPercentThreshold

      // Update challenge status
      await db
        .update(draftChallengesInDa)
        .set({
          status: isChallengeValid ? 'resolved' : 'dismissed',
          resolvedAt: new Date().toISOString()
        })
        .where(eq(draftChallengesInDa.id, challenge.id))

      // If challenge is valid, remove the challenged pick
      if (isChallengeValid) {
        await db
          .delete(draftSelectionsInDa)
          .where(
            and(
              eq(draftSelectionsInDa.draftId, draft.id),
              eq(draftSelectionsInDa.pickNumber, challenge.challengedPickNumber)
            )
          )

        // Get the challenged player's position
        const [challengedPlayer] = await db
          .select({ position: draftUsersInDa.position })
          .from(draftUsersInDa)
          .where(
            and(
              eq(draftUsersInDa.draftId, draft.id),
              eq(draftUsersInDa.userId, challenge.challengedUserId)
            )
          )
          .limit(1)

        // Set the draft back to the challenged player's turn and restart timer
        await db
          .update(draftsInDa)
          .set({
            draftState: 'active',
            currentPositionOnClock: challengedPlayer?.position || 1,
            turnStartedAt: new Date().toISOString() // Restart timer for redo
          })
          .where(eq(draftsInDa.id, draft.id))
      } else {
        // Challenge failed - check if this was during the final challenge window
        // Only end the draft if this was the final challenge window
        if (draft.draftState === 'challenge_window') {
          await db
            .update(draftsInDa)
            .set({
              draftState: 'completed',
              currentPositionOnClock: null
            })
            .where(eq(draftsInDa.id, draft.id))

          // Clear the join code
          await clearJoinCode(draft.id)
        } else {
          // Challenge failed during active state - advance to next player
          // Get participant count and calculate next drafter
          const numParticipants = await getParticipantCountByGuid(draft.guid)
          const { nextPosition, isDraftCompleted } = calculateNextDrafter(
            challenge.challengedPickNumber,
            numParticipants,
            draft.numRounds
          )

          await db
            .update(draftsInDa)
            .set({
              draftState: isDraftCompleted ? 'completed' : 'active',
              currentPositionOnClock: nextPosition,
              turnStartedAt: new Date().toISOString() // Start timer for next player
            })
            .where(eq(draftsInDa.id, draft.id))

          // Clear the join code if draft is completed
          if (isDraftCompleted) {
            await clearJoinCode(draft.id)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Challenge vote error:', error)
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 })
  }
}
