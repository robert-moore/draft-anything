import { db } from '@/lib/db'
import { drafts, draftClients } from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'
import { eq, count } from 'drizzle-orm'

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

    // Check if draft exists and is in setting_up state
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

    if (draft.draftState !== 'setting_up') {
      return NextResponse.json(
        { error: 'Draft cannot be started in its current state' },
        { status: 400 }
      )
    }

    // Check if we have enough participants
    const [participantCount] = await db
      .select({ count: count() })
      .from(draftClients)
      .where(eq(draftClients.draftId, draftId))

    if (participantCount.count < 2) {
      return NextResponse.json(
        { error: 'At least 2 participants required to start draft' },
        { status: 400 }
      )
    }

    // Update draft state to active
    const now = new Date().toISOString()
    await db
      .update(drafts)
      .set({ 
        draftState: 'active',
        startTime: now
      })
      .where(eq(drafts.id, draftId))

    return NextResponse.json({ 
      message: 'Draft started successfully',
      draftState: 'active'
    })
  } catch (error) {
    console.error('Error starting draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}