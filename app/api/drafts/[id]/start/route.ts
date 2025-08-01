import { draftsInDa, draftUsersInDa } from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { getUtcNow } from '@/lib/time-utils'
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

    // Check if draft exists and is in setting_up state
    const draft = await getDraftByGuid(draftGuid)

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.draftState !== 'setting_up') {
      return NextResponse.json(
        { error: 'Draft cannot be started in its current state' },
        { status: 400 }
      )
    }

    // Check if user is the admin (either authenticated user or guest)
    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    if (!userOrGuest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if the user is the admin
    if (draft.adminUserId !== userOrGuest.id) {
      return NextResponse.json(
        { error: 'Only the draft admin can start the draft' },
        { status: 403 }
      )
    }

    // Check if we have enough participants
    const [participantCount] = await db
      .select({ count: count() })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draft.id))

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
      .where(eq(draftUsersInDa.draftId, draft.id))

    // Randomize order, filtering out null userIds
    const shuffled = participants
      .map(p => p.userId)
      .filter((id): id is string => id !== null)
      .sort(() => Math.random() - 0.5)

    // Assign positions starting from 1
    for (let i = 0; i < shuffled.length; i++) {
      await db
        .update(draftUsersInDa)
        .set({ position: i + 1 })
        .where(
          and(
            eq(draftUsersInDa.draftId, draft.id),
            eq(draftUsersInDa.userId, shuffled[i])
          )
        )
    }

    // Update draft state to active and initialize timer
    const updates: any = {
      draftState: 'active',
      currentPositionOnClock: 1,
      // Always set turnStartedAt to track elapsed time (for both timed and untimed drafts)
      turnStartedAt: getUtcNow()
    }

    await db.update(draftsInDa).set(updates).where(eq(draftsInDa.id, draft.id))

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
