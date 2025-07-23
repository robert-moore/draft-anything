import { draftUsersInDa } from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate draft GUID
    const guidResult = await parseDraftGuid({ params })
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Get draft details
    const draft = await getDraftByGuid(draftGuid)
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Only allow leaving during setup phase
    if (draft.draftState !== 'setting_up') {
      return NextResponse.json(
        { error: 'Can only leave draft during setup phase' },
        { status: 400 }
      )
    }

    // Check authentication (user or guest)
    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    if (!userOrGuest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user/guest is a participant
    const [participant] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, userOrGuest.id),
          eq(draftUsersInDa.isGuest, userOrGuest.type === 'guest')
        )
      )
      .limit(1)

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this draft' },
        { status: 403 }
      )
    }

    // Delete the user/guest from the draft
    await db
      .delete(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, userOrGuest.id),
          eq(draftUsersInDa.isGuest, userOrGuest.type === 'guest')
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
