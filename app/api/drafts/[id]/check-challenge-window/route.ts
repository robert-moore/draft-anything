import { draftsInDa } from '@/drizzle/schema'
import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { validateAndFetchDraftByGuid } from '@/lib/api/draft-helpers'
import { db } from '@/lib/db'
import { getElapsedSeconds } from '@/lib/time-utils'
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

    // Validate and fetch draft
    const draftResult = await validateAndFetchDraftByGuid(draftGuid)
    if (!draftResult.success) return draftResult.error
    const { draft } = draftResult

    // Check if draft is in challenge window and has expired
    if (draft.draftState === 'challenge_window' && draft.turnStartedAt) {
      const elapsedSeconds = getElapsedSeconds(draft.turnStartedAt)

      if (elapsedSeconds >= 30) {
        // Challenge window has expired, complete the draft
        await db
          .update(draftsInDa)
          .set({
            draftState: 'completed',
            currentPositionOnClock: null
          })
          .where(eq(draftsInDa.guid, draftGuid))

        return NextResponse.json({
          message: 'Challenge window expired, draft completed',
          draftState: 'completed',
          expired: true
        })
      }
    }

    return NextResponse.json({
      message: 'Challenge window still active',
      draftState: draft.draftState,
      expired: false
    })
  } catch (error) {
    console.error('Error checking challenge window:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
