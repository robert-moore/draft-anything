import { draftAutopickQueuesInDa } from '@/drizzle/schema'
import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { validateAndFetchDraftByGuid } from '@/lib/api/draft-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { db } from '@/lib/db'
import { getUtcNow } from '@/lib/time-utils'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const queueSchema = z.object({
  queue: z.array(
    z.object({
      id: z.string(),
      payload: z.string().optional(),
      curatedOptionId: z.number().optional(),
      isUsed: z.boolean().optional()
    })
  )
})

/**
 * GET /api/drafts/[id]/autopick-queue
 * Get user's autopick queue
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
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return draftResult.error;

    const { draft } = draftResult

    // Get current user (authenticated or guest)
    const userResult = await getCurrentUserOrGuest(draft.id, request)
    if (!userResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find user's queue
    const [result] = await db
      .select()
      .from(draftAutopickQueuesInDa)
      .where(
        and(
          eq(draftAutopickQueuesInDa.draftId, draftId),
          eq(draftAutopickQueuesInDa.userId, userResult.id)
        )
      )
      .limit(1)

    const queue = result?.queue || []

    return NextResponse.json({ queue }, { status: 200 })
  } catch (error: any) {
    console.error('Error getting autopick queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/drafts/[id]/autopick-queue
 * Replace entire autopick queue (autosave)
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
    const draftResult = await validateAndFetchDraftByGuid(draftGuid) 

    if (!draftResult.success) return draftResult.error;
    
    const { draft } = draftResult
    // Get current user (authenticated or guest)
    const userResult = await getCurrentUserOrGuest(draft.id, request)
    if (!userResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const bodyResult = await parseJsonRequest(request, queueSchema)
    if (!bodyResult.success) return bodyResult.error
    const { queue } = bodyResult.data

    const now = getUtcNow()

    // Upsert the user's queue
    await db
      .insert(draftAutopickQueuesInDa)
      .values({
        draftId: draft.id,
        userId: userResult.id,
        queue,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [draftAutopickQueuesInDa.draftId, draftAutopickQueuesInDa.userId],
        set: {
          queue,
          updatedAt: now
        }
      })

    return NextResponse.json(
      { message: 'Queue updated successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating autopick queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}