import {
  draftAutopickQueuesInDa,
  draftCuratedOptionsInDa
} from '@/drizzle/schema'
import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { validateAndFetchDraftByGuid } from '@/lib/api/draft-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { db } from '@/lib/db'
import { getUtcNow } from '@/lib/time-utils'
import { and, eq, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const addToQueueSchema = z
  .object({
    payload: z.string().optional(),
    curatedOptionId: z.number().optional()
  })
  .refine(data => data.payload || data.curatedOptionId, {
    message: 'Either payload or curatedOptionId must be provided'
  })

const reorderQueueSchema = z.object({
  queue: z.array(
    z.object({
      id: z.string(),
      payload: z.string().optional(),
      curatedOptionId: z.number().optional(),
      isUsed: z.boolean().optional()
    })
  )
})

interface QueueItem {
  id: string
  payload?: string
  curatedOptionId?: number
  isUsed?: boolean
}

/**
 * GET /api/drafts/[id]/autopick-queue
 * Get user's autopick queue for a draft
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

    // Get user's autopick queue
    const result = await db
      .select({ queue: draftAutopickQueuesInDa.queue })
      .from(draftAutopickQueuesInDa)
      .where(
        and(
          eq(draftAutopickQueuesInDa.draftId, draft.id),
          eq(draftAutopickQueuesInDa.userId, userOrGuest.id)
        )
      )
      .limit(1)

    const queue = (result[0]?.queue as QueueItem[]) || []

    // Enrich with curated option text if needed
    if (!draft.isFreeform && queue.length > 0) {
      const curatedIds = queue
        .filter(item => item.curatedOptionId)
        .map(item => item.curatedOptionId!)
      
      if (curatedIds.length > 0) {
        const options = await db
          .select({
            id: draftCuratedOptionsInDa.id,
            optionText: draftCuratedOptionsInDa.optionText
          })
          .from(draftCuratedOptionsInDa)
          .where(
            and(
              eq(draftCuratedOptionsInDa.draftId, draft.id),
              inArray(draftCuratedOptionsInDa.id, curatedIds)
            )
          )
        
        const optionMap = new Map(options.map(o => [o.id, o.optionText]))
        
        return NextResponse.json({
          queue: queue.map(item => ({
            ...item,
            curatedOptionText: item.curatedOptionId ? optionMap.get(item.curatedOptionId) : undefined
          }))
        }, { status: 200 })
      }
    }

    return NextResponse.json({ queue }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching autopick queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/drafts/[id]/autopick-queue
 * Add item to user's autopick queue
 */
export async function POST(
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
    const bodyResult = await parseJsonRequest(request, addToQueueSchema)
    if (!bodyResult.success) return bodyResult.error
    const { payload, curatedOptionId } = bodyResult.data

    // For curated drafts, validate the curated option
    if (curatedOptionId) {
      const [option] = await db
        .select()
        .from(draftCuratedOptionsInDa)
        .where(
          and(
            eq(draftCuratedOptionsInDa.id, curatedOptionId),
            eq(draftCuratedOptionsInDa.draftId, draft.id)
          )
        )

      if (!option) {
        return NextResponse.json(
          { error: 'Invalid curated option for this draft' },
          { status: 400 }
        )
      }
    }

    // Get existing queue
    const result = await db
      .select({ queue: draftAutopickQueuesInDa.queue })
      .from(draftAutopickQueuesInDa)
      .where(
        and(
          eq(draftAutopickQueuesInDa.draftId, draft.id),
          eq(draftAutopickQueuesInDa.userId, userOrGuest.id)
        )
      )
      .limit(1)

    const currentQueue = (result[0]?.queue as QueueItem[]) || []

    // Check for duplicates in curated drafts
    if (curatedOptionId) {
      const exists = currentQueue.some(
        item => item.curatedOptionId === curatedOptionId && !item.isUsed
      )
      if (exists) {
        return NextResponse.json(
          { error: 'This option is already in your queue' },
          { status: 400 }
        )
      }
    }

    // Create new item
    const newItem: QueueItem = {
      id: crypto.randomUUID(),
      payload: payload || undefined,
      curatedOptionId: curatedOptionId || undefined,
      isUsed: false
    }

    const updatedQueue = [...currentQueue, newItem]

    // Upsert the queue
    if (result.length > 0) {
      await db
        .update(draftAutopickQueuesInDa)
        .set({
          queue: updatedQueue,
          updatedAt: getUtcNow()
        })
        .where(
          and(
            eq(draftAutopickQueuesInDa.draftId, draft.id),
            eq(draftAutopickQueuesInDa.userId, userOrGuest.id)
          )
        )
    } else {
      await db
        .insert(draftAutopickQueuesInDa)
        .values({
          draftId: draft.id,
          userId: userOrGuest.id,
          queue: updatedQueue,
          createdAt: getUtcNow(),
          updatedAt: getUtcNow()
        })
    }

    return NextResponse.json(
      { queueItem: newItem, message: 'Item added to queue' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error adding to autopick queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/drafts/[id]/autopick-queue
 * Replace entire autopick queue (for reordering)
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
    const bodyResult = await parseJsonRequest(request, reorderQueueSchema)
    if (!bodyResult.success) return bodyResult.error
    const { queue } = bodyResult.data

    // Upsert the queue
    const result = await db
      .select()
      .from(draftAutopickQueuesInDa)
      .where(
        and(
          eq(draftAutopickQueuesInDa.draftId, draft.id),
          eq(draftAutopickQueuesInDa.userId, userOrGuest.id)
        )
      )
      .limit(1)

    if (result.length > 0) {
      await db
        .update(draftAutopickQueuesInDa)
        .set({
          queue,
          updatedAt: getUtcNow()
        })
        .where(
          and(
            eq(draftAutopickQueuesInDa.draftId, draft.id),
            eq(draftAutopickQueuesInDa.userId, userOrGuest.id)
          )
        )
    } else {
      await db
        .insert(draftAutopickQueuesInDa)
        .values({
          draftId: draft.id,
          userId: userOrGuest.id,
          queue,
          createdAt: getUtcNow(),
          updatedAt: getUtcNow()
        })
    }

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

/**
 * DELETE /api/drafts/[id]/autopick-queue
 * Delete item from queue
 */
export async function DELETE(
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

    const searchParams = request.nextUrl.searchParams
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      )
    }

    // Get existing queue
    const result = await db
      .select({ queue: draftAutopickQueuesInDa.queue })
      .from(draftAutopickQueuesInDa)
      .where(
        and(
          eq(draftAutopickQueuesInDa.draftId, draft.id),
          eq(draftAutopickQueuesInDa.userId, userOrGuest.id)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Queue not found' },
        { status: 404 }
      )
    }

    const currentQueue = (result[0].queue as QueueItem[]) || []
    const updatedQueue = currentQueue.filter(item => item.id !== itemId)

    await db
      .update(draftAutopickQueuesInDa)
      .set({
        queue: updatedQueue,
        updatedAt: getUtcNow()
      })
      .where(
        and(
          eq(draftAutopickQueuesInDa.draftId, draft.id),
          eq(draftAutopickQueuesInDa.userId, userOrGuest.id)
        )
      )

    return NextResponse.json(
      { message: 'Item removed from queue' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting from autopick queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}