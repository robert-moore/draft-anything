import {
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa,
  profilesInDa
} from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { parseDraftId } from '@/lib/api/route-helpers'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Validate draft ID
    const idResult = await parseDraftId({ params })
    if (!idResult.success) return idResult.error
    const { draftId } = idResult

    // Get draft details
    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const isAdmin = draft?.adminUserId === user.id

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

    // Get draft picks with user names in a single query
    const picksQuery = await db
      .select({
        pickNumber: draftSelectionsInDa.pickNumber,
        userId: draftSelectionsInDa.userId,
        payload: draftSelectionsInDa.payload,
        createdAt: draftSelectionsInDa.createdAt,
        userName: profilesInDa.name,
        wasAutoPick: draftSelectionsInDa.wasAutoPick,
        timeTakenSeconds: draftSelectionsInDa.timeTakenSeconds
      })
      .from(draftSelectionsInDa)
      .innerJoin(profilesInDa, eq(draftSelectionsInDa.userId, profilesInDa.id))
      .where(eq(draftSelectionsInDa.draftId, draftId))

    // Transform picks to include clientId and clientName for backward compatibility
    const picks = picksQuery.map(pick => ({
      pickNumber: pick.pickNumber,
      userId: pick.userId,
      payload: pick.payload,
      createdAt: pick.createdAt,
      clientId: pick.userId, // For backward compatibility
      clientName: pick.userName || 'Unknown',
      wasAutoPick: pick.wasAutoPick,
      timeTakenSeconds: pick.timeTakenSeconds
    }))

    return NextResponse.json({
      draft,
      participants: participantsQuery,
      picks: picks.sort((a, b) => a.pickNumber - b.pickNumber),
      currentUser: user,
      isAdmin
    })
  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
