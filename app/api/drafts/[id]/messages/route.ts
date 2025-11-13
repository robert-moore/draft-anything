import { draftMessagesInDa, draftUsersInDa, draftsInDa } from '@/drizzle/schema'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { and, asc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { validate as validateUUID } from 'uuid'

//get draft by guid and return integer id
async function getDraftIdFromGuid(guid: string) {
  const [draft] = await db
    .select({ id: draftsInDa.id })
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, guid))
    .limit(1)

  //sql: SELECT id FROM drafts WHERE guide = $guid LIMIT 1

  return draft?.id || null
}

//check if user is participant in the draft
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

//send messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guid } = await params

  if (!validateUUID(guid)) {
    return NextResponse.json(
      { error: 'Invalid draft ID format' },
      { status: 400 }
    )
  }

  const draftId = await getDraftIdFromGuid(guid)
  if (!draftId)
    return NextResponse.json({ error: 'Draft Not Found' }, { status: 404 })

  //   identify whether user is logged in or is guest
  const userOrGuest = await getCurrentUserOrGuest(draftId, req)
  if (!userOrGuest)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  //make sure user is a participant
  const allowed = await isParticipant(draftId, userOrGuest.id)
  if (!allowed)
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  const { messageContent } = await req.json()
  if (!messageContent || messageContent.trim().length === 0)
    return NextResponse.json(
      { error: 'Message cannot be empty' },
      { status: 400 }
    )

  //insert message into database
  const [inserted] = await db
    .insert(draftMessagesInDa)
    .values({
      draftId,
      userId: userOrGuest.id,
      messageContent: messageContent.trim()
    })
    .returning({
      id: draftMessagesInDa.id,
      messageContent: draftMessagesInDa.messageContent,
      createdAt: draftMessagesInDa.createdAt
    })
  return NextResponse.json({ message: inserted }, { status: 201 })
}

//get messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guid } = await params

  //get draft Id
  const draftId = await getDraftIdFromGuid(guid)
  if (!draftId)
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  //fetch messages from draft
  const messages = await db
    .select({
      id: draftMessagesInDa.id,
      userId: draftMessagesInDa.userId,
      draftUsername: draftUsersInDa.draftUsername,
      messageContent: draftMessagesInDa.messageContent,
      createdAt: draftMessagesInDa.createdAt
    })
    .from(draftMessagesInDa)
    .leftJoin(
      draftUsersInDa,
      and(
        eq(draftMessagesInDa.draftId, draftUsersInDa.draftId),
        eq(draftMessagesInDa.userId, draftUsersInDa.userId)
      )
    )
    .where(eq(draftMessagesInDa.draftId, draftId))
    .orderBy(asc(draftMessagesInDa.createdAt))

  return NextResponse.json({ messages })
}
