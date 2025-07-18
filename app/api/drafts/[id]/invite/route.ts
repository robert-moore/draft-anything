import { draftsInDa } from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { parseDraftId } from '@/lib/api/route-helpers'
import { getAppUrl } from '@/lib/utils/get-app-url'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate draft ID
    const idResult = await parseDraftId({ params })
    if (!idResult.success) return idResult.error
    const { draftId } = idResult

    // Check if draft exists
    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // For now, just return the direct link
    // In the future, you could add invite tokens to the database
    const inviteLink = `${getAppUrl()}/drafts/${draftId}`

    return NextResponse.json({
      inviteLink,
      draftId,
      draftName: draft.name
    })
  } catch (error) {
    console.error('Error creating invite link:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
