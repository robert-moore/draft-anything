import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getAppUrl } from '@/lib/utils/get-app-url'
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

    // Validate draft GUID
    const guidResult = await parseDraftGuid({ params })
    if (!guidResult.success) return guidResult.error
    const { draftGuid } = guidResult

    // Check if draft exists
    const draft = await getDraftByGuid(draftGuid)

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // For now, just return the direct link
    // In the future, you could add invite tokens to the database
    const inviteLink = `${getAppUrl()}/drafts/${draftGuid}`

    return NextResponse.json({
      inviteLink,
      draftId: draft.id,
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
