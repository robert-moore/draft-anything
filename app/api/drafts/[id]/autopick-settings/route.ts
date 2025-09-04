import { draftUsersInDa } from '@/drizzle/schema'
import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { validateAndFetchDraftByGuid } from '@/lib/api/draft-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for updating autopick settings
const updateAutopickSettingsSchema = z.object({
  enabled: z.boolean()
})

/**
 * GET /api/drafts/[id]/autopick-settings
 * Get user's autopick setting for a draft
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate draft GUID
    const guidResult = await parseDraftGuid(context)
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Validate and fetch draft
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return draftResult.error
    const { draft } = draftResult

    // Get current user or guest
    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    if (!userOrGuest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's autopick setting from draft_users table
    const [draftUser] = await db
      .select({
        autopickEnabled: draftUsersInDa.autopickEnabled
      })
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, userOrGuest.id)
        )
      )

    if (!draftUser) {
      return NextResponse.json(
        { error: 'You are not a participant in this draft' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { enabled: draftUser.autopickEnabled },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching autopick settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/drafts/[id]/autopick-settings
 * Update user's autopick setting for a draft
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate draft GUID
    const guidResult = await parseDraftGuid(context)
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Validate and fetch draft
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return draftResult.error
    const { draft } = draftResult

    // Get current user or guest
    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    if (!userOrGuest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate request body
    const bodyResult = await parseJsonRequest(request, updateAutopickSettingsSchema)
    if (!bodyResult.success) return bodyResult.error
    const { enabled } = bodyResult.data

    // Update user's autopick setting in draft_users table
    const result = await db
      .update(draftUsersInDa)
      .set({ autopickEnabled: enabled })
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, userOrGuest.id)
        )
      )
      .returning({ autopickEnabled: draftUsersInDa.autopickEnabled })

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'You are not a participant in this draft' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { 
        enabled: result[0].autopickEnabled,
        message: `Autopick ${enabled ? 'enabled' : 'disabled'}`
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating autopick settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}