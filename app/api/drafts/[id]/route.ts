import {
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa,
  profilesInDa
} from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
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

    // Await params before accessing properties
    const { id } = await params
    const draftId = parseInt(id)
    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 })
    }

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
        userName: profilesInDa.name
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
      clientName: pick.userName || 'Unknown'
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
