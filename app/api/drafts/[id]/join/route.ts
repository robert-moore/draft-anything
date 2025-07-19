import { draftUsersInDa, profilesInDa } from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for joining a draft
const joinDraftSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50)
})

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

    // Get draft by GUID
    const draft = await getDraftByGuid(draftGuid)
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Validate request body
    const bodyResult = await parseJsonRequest(request, joinDraftSchema)
    if (!bodyResult.success) return bodyResult.error
    const { name } = bodyResult.data

    // Check for existing participants with the same name and disambiguate
    const existingParticipants = await db
      .select({ draftUsername: draftUsersInDa.draftUsername })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draft.id))

    let finalName = name
    let counter = 2
    while (existingParticipants.some(p => p.draftUsername === finalName)) {
      finalName = `${name} (${counter})`
      counter++
    }

    // Ensure user profile exists, create if it doesn't
    const [existingProfile] = await db
      .select()
      .from(profilesInDa)
      .where(eq(profilesInDa.id, user.id))
      .limit(1)

    if (!existingProfile) {
      // Create profile if it doesn't exist
      await db
        .insert(profilesInDa)
        .values({
          id: user.id,
          name: name || user.email || 'Anonymous',
          createdAt: new Date().toISOString()
        })
        .onConflictDoNothing()
    } else if (name !== existingProfile.name) {
      // Update user's profile name if provided and different
      await db
        .update(profilesInDa)
        .set({ name })
        .where(eq(profilesInDa.id, user.id))
    }

    // Check if user is already a participant
    const [existingParticipant] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, user.id)
        )
      )
      .limit(1)

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Already joined this draft' },
        { status: 400 }
      )
    }

    // Get current participant count
    const participantCount = await db
      .select({ count: count() })
      .from(draftUsersInDa)
      .where(eq(draftUsersInDa.draftId, draft.id))

    if (participantCount[0].count >= draft.maxDrafters) {
      return NextResponse.json({ error: 'Draft is full' }, { status: 400 })
    }

    // Add user to draft
    const [newParticipant] = await db
      .insert(draftUsersInDa)
      .values({
        draftId: draft.id,
        userId: user.id,
        draftUsername: finalName,
        position: participantCount[0].count + 1,
        isReady: true,
        createdAt: new Date().toISOString()
      })
      .returning()

    return NextResponse.json({
      id: user.id,
      name: finalName,
      position: newParticipant.position,
      isReady: newParticipant.isReady,
      createdAt: newParticipant.createdAt
    })
  } catch (error) {
    console.error('Error joining draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
