import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { performAutopick } from '@/lib/auto-pick-logic'
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

    // IMPORTANT: No authentication check here!
    // This endpoint needs to work even when the player who should
    // autopick is not connected. Other viewers trigger the autopick
    // on their behalf when the timer expires.

    // Use the clean autopick logic
    await performAutopick(draftGuid)

    return NextResponse.json(
      { message: 'Auto-pick check completed' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error checking auto-pick:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
