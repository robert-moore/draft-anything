import {
  draftMessagesInDa,
  draftReactionsInDa,
  draftUsersInDa,
  draftsInDa
} from '@/drizzle/schema'
import { getDraftByGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// Helper: get draft by guid and return integer id
async function getDraftIdFromGuid(guid: string) {
  const [draft] = await db
    .select({ id: draftsInDa.id })
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, guid))
    .limit(1)
  return draft?.id || null
}

// Helper: check if user is a participant in the draft
async function isParticipant(draftId: number, userId: string) {
  const participant = await db
    .select()
    .from(draftUsersInDa)
    .where(
      and(
        eq(draftUsersInDa.draftId, draftId),
        eq(draftUsersInDa.userId, userId)
      )
    )
    .limit(1)
  return participant.length > 0
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guid } = await params
  const draftId = await getDraftIdFromGuid(guid)
  if (!draftId)
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  // Try authenticated user or guest
  const userOrGuest = await getCurrentUserOrGuest(draftId, req)
  if (!userOrGuest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pickNumber, emoji } = await req.json()
  if (!pickNumber)
    return NextResponse.json({ error: 'Missing pickNumber' }, { status: 400 })
  if (!(await isParticipant(draftId, userOrGuest.id)))
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  // If emoji is null or empty, set emoji to null (soft delete)
  if (emoji === null || emoji === '') {
    await db
      .insert(draftReactionsInDa)
      .values({
        draftId,
        pickNumber,
        userId: userOrGuest.id,
        emoji: null
      })
      .onConflictDoUpdate({
        target: [
          draftReactionsInDa.draftId,
          draftReactionsInDa.pickNumber,
          draftReactionsInDa.userId
        ],
        set: { emoji: null }
      })
    return NextResponse.json({ success: true })
  }
  // Upsert reaction: one reaction per user per pick
  await db
    .insert(draftReactionsInDa)
    .values({
      draftId,
      pickNumber,
      userId: userOrGuest.id,
      emoji
    })
    .onConflictDoUpdate({
      target: [
        draftReactionsInDa.draftId,
        draftReactionsInDa.pickNumber,
        draftReactionsInDa.userId
      ],
      set: { emoji }
    })
  return NextResponse.json({ success: true })
}

//SEND MESSAGES
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guid } = await params
  const draftId = await getDraftIdFromGuid(guid)
  if (!draftId)
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  // Always return all reactions for the draft, ignore pickNumber
  const reactions = await db
    .select({
      id: draftReactionsInDa.id,
      draftId: draftReactionsInDa.draftId,
      pickNumber: draftReactionsInDa.pickNumber,
      userId: draftReactionsInDa.userId,
      emoji: draftReactionsInDa.emoji,
      createdAt: draftReactionsInDa.createdAt
    })
    .from(draftReactionsInDa)
    .where(eq(draftReactionsInDa.draftId, draftId))
  return NextResponse.json({ reactions })
}

//GET MESSAGES
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guid } = await params

  //get draft ID
  const draftId = await getDraftByGuid(guid)
  if (!draftId)
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  //get all messages from draft
  const messages = await db
    .select({
      id: draftMessagesInDa.id,
      userId: draftMessagesInDa.userId,
      messageContent: draftMessagesInDa.messageContent,
      createdAt: draftMessagesInDa.createdAt
    })
    .from(draftMessagesInDa)
    .where(eq(draftMessagesInDa.draftId, draftId.id))
    .orderBy(desc(draftMessagesInDa.createdAt))

  return NextResponse.json({ messages })
}
