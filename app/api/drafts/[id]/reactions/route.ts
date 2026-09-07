import { draftReactionsInDa, draftsInDa } from '@/drizzle/schema'
import { getCurrentUserOrGuest } from '@/lib/api/guest-helpers'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { validate as validateUUID } from 'uuid'

// Helper: get draft by guid and return integer id
async function getDraftIdFromGuid(guid: string) {
  const [draft] = await db
    .select({ id: draftsInDa.id })
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, guid))
    .limit(1)
  return draft?.id || null
}

async function getReactor(draftId: number, req: NextRequest) {
  const userOrGuest = await getCurrentUserOrGuest(draftId, req)
  if (userOrGuest) return userOrGuest

  const clientId = req.headers.get('x-client-id')
  if (clientId && validateUUID(clientId)) {
    return { type: 'guest' as const, id: clientId }
  }

  return null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guid } = await params
  const draftId = await getDraftIdFromGuid(guid)
  if (!draftId)
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  const reactor = await getReactor(draftId, req)
  if (!reactor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pickNumber, emoji } = await req.json()
  if (!pickNumber)
    return NextResponse.json({ error: 'Missing pickNumber' }, { status: 400 })
  // If emoji is null or empty, set emoji to null (soft delete)
  if (emoji === null || emoji === '') {
    await db
      .insert(draftReactionsInDa)
      .values({
        draftId,
        pickNumber,
        userId: reactor.id,
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
      userId: reactor.id,
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
