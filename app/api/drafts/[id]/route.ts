import { db } from '@/lib/db'
import { draftsInDa, profilesInDa, draftUsersInDa, draftSelectionsInDa } from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const draftId = parseInt(params.id)
    if (isNaN(draftId)) {
      return NextResponse.json(
        { error: 'Invalid draft ID' },
        { status: 400 }
      )
    }

    // Get draft details
    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    // Get participants
    const participantsQuery = await db
      .select({
        id: profilesInDa.id,
        name: profilesInDa.name,
        position: draftUsersInDa.position,
        isReady: draftUsersInDa.isReady,
        createdAt: draftUsersInDa.createdAt
      })
      .from(draftUsersInDa)
      .innerJoin(profilesInDa, eq(draftUsersInDa.userId, profilesInDa.id))
      .where(eq(draftUsersInDa.draftId, draftId))

    // Get draft picks
    const picksQuery = await db
      .select({
        pickNumber: draftSelectionsInDa.pickNumber,
        userId: draftSelectionsInDa.userId,
        payload: draftSelectionsInDa.payload,
        createdAt: draftSelectionsInDa.createdAt
      })
      .from(draftSelectionsInDa)
      .innerJoin(profilesInDa, eq(draftSelectionsInDa.userId, profilesInDa.id))
      .where(eq(draftSelectionsInDa.draftId, draftId))

    // Add user names to picks
    const picks = await Promise.all(
      picksQuery.map(async (pick) => {
        const [profile] = await db
          .select({ name: profilesInDa.name })
          .from(profilesInDa)
          .where(eq(profilesInDa.id, pick.userId))
        
        return {
          ...pick,
          clientId: pick.userId, // For backward compatibility
          clientName: profile?.name || 'Unknown'
        }
      })
    )

    return NextResponse.json({
      draft,
      participants: participantsQuery,
      picks: picks.sort((a, b) => a.pickNumber - b.pickNumber),
      currentUser: user
    })
  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}