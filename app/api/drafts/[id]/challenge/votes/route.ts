import {
  draftChallengesInDa,
  draftChallengeVotesInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { and, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

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
    let user = null
    if (userOrGuest) {
      user = { id: userOrGuest.id }
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

    // Get total participants (excluding challenged player)
    const totalParticipants = await db
      .select({ count: count() })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draft.id))

    const eligibleVoters = totalParticipants[0].count - 1 // -1 for challenged player

    // Get vote counts
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

    const invalidVotes = await db
      .select({ count: count() })
      .from(draftChallengeVotesInDa)
      .where(
        and(
          eq(draftChallengeVotesInDa.challengeId, challenge.id),
          eq(draftChallengeVotesInDa.vote, false)
        )
      )

    // Check if user has voted
    let userVote = undefined
    if (user) {
      const [vote] = await db
        .select()
        .from(draftChallengeVotesInDa)
        .where(
          and(
            eq(draftChallengeVotesInDa.challengeId, challenge.id),
            eq(draftChallengeVotesInDa.voterUserId, user.id)
          )
        )
        .limit(1)
      userVote = vote?.vote
    }

    return NextResponse.json({
      totalVotes: totalVotes[0].count,
      validVotes: validVotes[0].count,
      invalidVotes: invalidVotes[0].count,
      eligibleVoters,
      userVote: userVote,
      fiftyPercentThreshold: Math.ceil(eligibleVoters / 2)
    })
  } catch (error) {
    console.error('Challenge votes retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve vote counts' },
      { status: 500 }
    )
  }
}
