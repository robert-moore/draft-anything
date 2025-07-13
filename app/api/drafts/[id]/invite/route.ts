import { db } from '@/lib/db'
import { drafts } from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const draftId = parseInt(params.id)
    if (isNaN(draftId)) {
      return NextResponse.json(
        { error: 'Invalid draft ID' },
        { status: 400 }
      )
    }

    // Check if draft exists
    const [draft] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.id, draftId))

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    // For now, just return the direct link
    // In the future, you could add invite tokens to the database
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/drafts/${draftId}`

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