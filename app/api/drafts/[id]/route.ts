import { db } from '@/lib/db'
import { drafts, clients, draftClients, draftSelectionsInDa } from '@/drizzle/schema'
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
      .from(drafts)
      .where(eq(drafts.id, draftId))

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    // Get participants
    const participantsQuery = await db
      .select({
        id: clients.id,
        name: clients.name,
        position: draftClients.position,
        isReady: draftClients.isReady,
        createdAt: draftClients.createdAt
      })
      .from(draftClients)
      .innerJoin(clients, eq(draftClients.clientId, clients.id))
      .where(eq(draftClients.draftId, draftId))

    // Get draft picks
    const picksQuery = await db
      .select({
        pickNumber: draftSelectionsInDa.pickNumber,
        clientId: draftSelectionsInDa.clientId,
        payload: draftSelectionsInDa.payload,
        createdAt: draftSelectionsInDa.createdAt
      })
      .from(draftSelectionsInDa)
      .innerJoin(clients, eq(draftSelectionsInDa.clientId, clients.id))
      .where(eq(draftSelectionsInDa.draftId, draftId))

    // Add client names to picks
    const picks = await Promise.all(
      picksQuery.map(async (pick) => {
        const [client] = await db
          .select({ name: clients.name })
          .from(clients)
          .where(eq(clients.id, pick.clientId))
        
        return {
          ...pick,
          clientName: client?.name || 'Unknown'
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