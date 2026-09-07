import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { resolveExpiredAuction } from '@/lib/auction-logic'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guidResult = await parseDraftGuid(context)
    if (!guidResult.success) return guidResult.error

    const resolved = await resolveExpiredAuction(guidResult.draftGuid)

    return NextResponse.json({
      message: 'Auction timer check completed',
      resolved
    })
  } catch (error) {
    console.error('Error resolving auction timer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
