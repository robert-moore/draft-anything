import { draftCuratedOptionsInDa } from '@/drizzle/schema'
import { parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    // Validate draft GUID
    const guidResult = await parseDraftGuid(context)
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Get the option ID from params
    const params = await context.params
    const optionId = parseInt(params.optionId)

    if (isNaN(optionId)) {
      return NextResponse.json({ error: 'Invalid option ID' }, { status: 400 })
    }

    // Fetch the curated option
    const [curatedOption] = await db
      .select({
        id: draftCuratedOptionsInDa.id,
        optionText: draftCuratedOptionsInDa.optionText,
        isUsed: draftCuratedOptionsInDa.isUsed
      })
      .from(draftCuratedOptionsInDa)
      .where(eq(draftCuratedOptionsInDa.id, optionId))

    if (!curatedOption) {
      return NextResponse.json(
        { error: 'Curated option not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: curatedOption.id,
      optionText: curatedOption.optionText,
      isUsed: curatedOption.isUsed
    })
  } catch (error) {
    console.error('Error fetching curated option:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
