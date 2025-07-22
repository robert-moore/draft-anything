import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { performAutoPickForDraft } from '@/lib/auto-pick-logic'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Auto-pick: Backend check started')

    // Validate draft GUID
    const guidResult = await parseDraftGuid(context)
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Use the shared auto-pick logic
    await performAutoPickForDraft(draftGuid)

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
