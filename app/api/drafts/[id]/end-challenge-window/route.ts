import { draftsInDa } from '@/drizzle/schema'
import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { validateAndFetchDraftByGuid } from '@/lib/api/draft-helpers'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
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

    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate and fetch draft
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return draftResult.error
    const { draft } = draftResult

    // Check if draft is in challenge window
    if (draft.draftState !== 'challenge_window') {
      return NextResponse.json(
        { error: 'Draft is not in challenge window' },
        { status: 400 }
      )
    }

    // Complete the draft
    await db
      .update(draftsInDa)
      .set({
        draftState: 'completed',
        currentPositionOnClock: null
      })
      .where(eq(draftsInDa.guid, draftGuid))

    return NextResponse.json(
      { message: 'Challenge window ended, draft completed' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error ending challenge window:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
