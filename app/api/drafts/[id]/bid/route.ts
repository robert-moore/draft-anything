import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { MIN_BID } from '@/lib/auction'
import { bidOnAuction } from '@/lib/auction-logic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bidSchema = z.object({
  amount: z.number().int().min(MIN_BID)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guidResult = await parseDraftGuid({ params })
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    const draft = await getDraftByGuid(draftGuid)
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const userOrGuest = await getCurrentUserOrGuest(draft.id, request)
    if (!userOrGuest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const bodyResult = await parseJsonRequest(request, bidSchema)
    if (!bodyResult.success) return bodyResult.error

    const result = await bidOnAuction({
      draftId: draft.id,
      userId: userOrGuest.id,
      amount: bodyResult.data.amount
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      )
    }

    return NextResponse.json({ message: 'Bid placed' })
  } catch (error) {
    console.error('Error bidding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
