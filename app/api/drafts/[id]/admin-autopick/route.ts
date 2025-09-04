import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { performAutopick } from '@/lib/auto-pick-logic'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { draftsInDa } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate draft GUID
    const guidResult = await parseDraftGuid(context)
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Get current user
    const currentUser = await getCurrentUser()
    if (!currentUser?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is draft admin
    const [draft] = await db
      .select({ adminUserId: draftsInDa.adminUserId })
      .from(draftsInDa)
      .where(eq(draftsInDa.guid, draftGuid))
      .limit(1)

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    if (draft.adminUserId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Only draft admin can autopick for others' },
        { status: 403 }
      )
    }

    // Use existing autopick logic with admin override
    await performAutopick(draftGuid, true)

    return NextResponse.json(
      { message: 'Admin autopick completed' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in admin autopick:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}