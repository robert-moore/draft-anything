import { db } from '@/lib/db'
import { drafts, clients, draftClients, draftSelectionsInDa } from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'
import { eq, and, count, max } from 'drizzle-orm'

export async function POST(
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

    const body = await request.json()
    const { payload } = body

    if (!payload || typeof payload !== 'string' || payload.trim().length === 0) {
      return NextResponse.json(
        { error: 'Pick content is required' },
        { status: 400 }
      )
    }

    // Check if draft exists and is active
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

    if (draft.draftState !== 'active') {
      return NextResponse.json(
        { error: 'Draft is not active' },
        { status: 400 }
      )
    }

    // Check if user is in this draft
    const [participant] = await db
      .select()
      .from(draftClients)
      .where(and(
        eq(draftClients.draftId, draftId),
        eq(draftClients.clientId, user.id)
      ))

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this draft' },
        { status: 403 }
      )
    }

    // Get current pick number
    const [maxPickResult] = await db
      .select({ maxPick: max(draftSelectionsInDa.pickNumber) })
      .from(draftSelectionsInDa)
      .where(eq(draftSelectionsInDa.draftId, draftId))

    const nextPickNumber = (maxPickResult.maxPick || 0) + 1

    // Get client name for response
    const [client] = await db
      .select({ name: clients.name })
      .from(clients)
      .where(eq(clients.id, user.id))

    // Create the pick
    const now = new Date().toISOString()
    await db
      .insert(draftSelectionsInDa)
      .values({
        draftId,
        clientId: user.id,
        pickNumber: nextPickNumber,
        payload: payload.trim(),
        createdAt: now
      })

    // Return the new pick
    return NextResponse.json({
      pickNumber: nextPickNumber,
      clientId: user.id,
      clientName: client?.name || 'Unknown',
      payload: payload.trim(),
      createdAt: now
    }, { status: 201 })
  } catch (error) {
    console.error('Error making pick:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}