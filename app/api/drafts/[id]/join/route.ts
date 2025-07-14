import { draftsInDa, draftUsersInDa, profilesInDa } from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

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

    const { id } = await params
    const draftId = parseInt(id)

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if draft exists and is in setting_up state
    const [draft] = await db
      .select()
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.draftState !== 'setting_up') {
      return NextResponse.json(
        { error: 'Draft is not accepting new participants' },
        { status: 400 }
      )
    }

    // Check if draft is full
    const [participantCount] = await db
      .select({ count: count() })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draftId))

    if (participantCount.count >= draft.maxDrafters) {
      return NextResponse.json({ error: 'Draft is full' }, { status: 400 })
    }

    // Check if user is already in this draft
    const [existingParticipant] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draftId),
          eq(draftUsersInDa.userId, user.id)
        )
      )

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'You are already in this draft' },
        { status: 400 }
      )
    }

    // Create or update profile record
    const now = new Date().toISOString()

    // First check if profile exists
    const [existingProfile] = await db
      .select()
      .from(profilesInDa)
      .where(eq(profilesInDa.id, user.id))

    if (!existingProfile) {
      // Create new profile
      await db.insert(profilesInDa).values({
        id: user.id,
        name: name.trim(),
        createdAt: now
      })
    } else {
      // Update profile name
      await db
        .update(profilesInDa)
        .set({ name: name.trim() })
        .where(eq(profilesInDa.id, user.id))
    }

    // Add participant to draft
    await db.insert(draftUsersInDa).values({
      draftId,
      userId: user.id,
      draftUsername: name.trim(),
      position: participantCount.count + 1,
      isReady: true,
      createdAt: now
    })

    // Return the new participant data
    return NextResponse.json(
      {
        id: user.id,
        name: name.trim(),
        position: participantCount.count + 1,
        isReady: true
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error joining draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
