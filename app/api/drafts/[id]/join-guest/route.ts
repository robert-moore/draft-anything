import { draftUsersInDa } from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { parseJsonRequest } from '@/lib/api/validation'
import { db } from '@/lib/db'
import { and, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for joining a draft as guest
const joinGuestDraftSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  clientId: z.string().uuid('Invalid client ID')
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const bodyResult = await parseJsonRequest(request, joinGuestDraftSchema)
    if (!bodyResult.success) return bodyResult.error
    const { name, clientId } = bodyResult.data

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

    // Check if guest is already a participant
    const [existingParticipant] = await db
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, clientId),
          eq(draftUsersInDa.isGuest, true)
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

    // Add guest to draft
    const [newParticipant] = await db
      .insert(draftUsersInDa)
      .values({
        draftId: draft.id,
        userId: clientId,
        draftUsername: finalName,
        position: participantCount[0].count + 1,
        isReady: true,
        isGuest: true,
        createdAt: new Date().toISOString()
      })
      .returning()

    return NextResponse.json({
      id: clientId,
      name: finalName,
      position: newParticipant.position,
      isReady: newParticipant.isReady,
      isGuest: true,
      createdAt: newParticipant.createdAt
    })
  } catch (error) {
    console.error('Error joining draft as guest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
