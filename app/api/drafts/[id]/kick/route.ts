import { draftUsersInDa } from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
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

    // Validate draft GUID
    const guidResult = await parseDraftGuid({ params })
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Get draft details
    const draft = await getDraftByGuid(draftGuid)
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Check if user is admin
    if (draft.adminUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only admin can kick users' },
        { status: 403 }
      )
    }

    // Only allow kicking during setup phase
    if (draft.draftState !== 'setting_up') {
      return NextResponse.json(
        { error: 'Can only kick users during setup phase' },
        { status: 400 }
      )
    }

    // Get the user ID to kick from request body
    const { userIdToKick } = await request.json()
    if (!userIdToKick) {
      return NextResponse.json(
        { error: 'User ID to kick is required' },
        { status: 400 }
      )
    }

    // Prevent admin from kicking themselves
    if (userIdToKick === user.id) {
      return NextResponse.json(
        { error: 'Admin cannot kick themselves' },
        { status: 400 }
      )
    }

    // Check if user to kick is a participant
    const [participant] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, userIdToKick)
        )
      )
      .limit(1)

    if (!participant) {
      return NextResponse.json(
        { error: 'User is not a participant in this draft' },
        { status: 404 }
      )
    }

    // Delete the user from the draft
    await db
      .delete(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, userIdToKick)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error kicking user from draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
