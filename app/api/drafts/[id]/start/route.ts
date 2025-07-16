import { draftsInDa, draftUsersInDa } from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

    const { id } = await params
    const draftId = parseInt(id)
    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 })
    }

    // Check if draft exists and is in setting_up state
    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
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
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draftId))

    if (participantCount.count < 2) {
      return NextResponse.json(
        { error: 'At least 2 participants required to start draft' },
        { status: 400 }
      )
    }

    // Fetch all users in this draft
    const participants = await db
      .select({
        userId: draftUsersInDa.userId
      })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draftId))

    // Randomize order
    const shuffled = participants
      .map(p => p.userId)
      .sort(() => Math.random() - 0.5)

    // Assign positions starting from 1
    for (let i = 0; i < shuffled.length; i++) {
      await db
        .update(draftUsersInDa)
        .set({ position: i + 1 })
        .where(
          and(
            eq(draftUsersInDa.draftId, draftId),
            eq(draftUsersInDa.userId, shuffled[i])
          )
        )
    }

    // Update draft state to active
    await db
      .update(draftsInDa)
      .set({ draftState: 'active', currentPositionOnClock: 1 })
      .where(eq(draftsInDa.id, draftId))

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
