import {
  draftChallengesInDa,
  draftChallengeVotesInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const draftId = parseInt(resolvedParams.id)
    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 })
    }

    // Get the active challenge
    const [challenge] = await db
      .select()
      .from(draftChallengesInDa)
      .where(
        and(
          eq(draftChallengesInDa.draftId, draftId),
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
      .where(eq(draftUsersInDa.draftId, draftId))

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
    const [userVote] = await db
      .select()
      .from(draftChallengeVotesInDa)
      .where(
        and(
          eq(draftChallengeVotesInDa.challengeId, challenge.id),
          eq(draftChallengeVotesInDa.voterUserId, user.id)
        )
      )
      .limit(1)

    return NextResponse.json({
      totalVotes: totalVotes[0].count,
      validVotes: validVotes[0].count,
      invalidVotes: invalidVotes[0].count,
      eligibleVoters,
      userVote: userVote?.vote,
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
