import {
  draftSelectionsInDa,
  draftsInDa,
  draftUsersInDa
} from '@/drizzle/schema'
import { db } from '@/lib/db'
import { getUtcNow } from '@/lib/time-utils'
import { and, count, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// Use Drizzle-inferred types from schema
export type Draft = typeof draftsInDa.$inferSelect
export type DraftUser = typeof draftUsersInDa.$inferSelect

export interface NextDrafterResult {
  nextPosition: number | null
  isDraftCompleted: boolean
}

// Use Partial for updates since we only update specific fields
export type DraftUpdateData = Partial<
  Pick<
    typeof draftsInDa.$inferInsert,
    'currentPositionOnClock' | 'draftState' | 'turnStartedAt'
  >
>

/**
 * Validates and fetches a draft by GUID, ensuring it exists and is active
 */
export async function validateAndFetchDraftByGuid(
  draftGuid: string
): Promise<
  { success: true; draft: Draft } | { success: false; error: NextResponse }
> {
  const [draft] = await db
    .select()
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, draftGuid))

  if (!draft) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }
  }

  return { success: true, draft }
}

/**
 * Validates and fetches a draft, ensuring it exists and is active
 */
export async function validateAndFetchDraft(
  draftId: number
): Promise<
  { success: true; draft: Draft } | { success: false; error: NextResponse }
> {
  const [draft] = await db
    .select()
    .from(draftsInDa)
    .where(eq(draftsInDa.id, draftId))

  if (!draft) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }
  }

  if (draft.draftState !== 'active') {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Draft is not active' },
        { status: 400 }
      )
    }
  }

  return { success: true, draft }
}

/**
 * Gets the current pick number (count of existing picks + 1) by draft GUID
 */
export async function getCurrentPickNumberByGuid(
  draftGuid: string
): Promise<number> {
  const [draft] = await db
    .select({ id: draftsInDa.id })
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, draftGuid))

  if (!draft) {
    throw new Error('Draft not found')
  }

  const [pickCountResult] = await db
    .select({ count: count() })
    .from(draftSelectionsInDa)
    .where(eq(draftSelectionsInDa.draftId, draft.id))

  return pickCountResult.count + 1
}

/**
 * Gets the current pick number (count of existing picks + 1)
 */
export async function getCurrentPickNumber(draftId: number): Promise<number> {
  const [pickCountResult] = await db
    .select({ count: count() })
    .from(draftSelectionsInDa)
    .where(eq(draftSelectionsInDa.draftId, draftId))

  return pickCountResult.count + 1
}

/**
 * Gets the number of participants in the draft by GUID
 */
export async function getParticipantCountByGuid(
  draftGuid: string
): Promise<number> {
  const [draft] = await db
    .select({ id: draftsInDa.id })
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, draftGuid))

  if (!draft) {
    throw new Error('Draft not found')
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(draftUsersInDa)
    .where(eq(draftUsersInDa.draftId, draft.id))

  return countResult.count
}

/**
 * Gets the number of participants in the draft
 */
export async function getParticipantCount(draftId: number): Promise<number> {
  const [countResult] = await db
    .select({ count: count() })
    .from(draftUsersInDa)
    .where(eq(draftUsersInDa.draftId, draftId))

  return countResult.count
}

/**
 * Calculates the next drafter position using snake draft logic
 */
export function calculateNextDrafter(
  currentPickNumber: number,
  numParticipants: number,
  numRounds: number
): NextDrafterResult {
  const totalPicks = numRounds * numParticipants
  const nextPickNumber = currentPickNumber + 1

  if (nextPickNumber > totalPicks) {
    return {
      nextPosition: null,
      isDraftCompleted: true
    }
  }

  const nextRound = Math.ceil(nextPickNumber / numParticipants)
  const nextPickInRound = (nextPickNumber - 1) % numParticipants

  const nextPosition =
    nextRound % 2 === 1
      ? nextPickInRound + 1 // 1-based, forward order
      : numParticipants - nextPickInRound // reverse order

  return {
    nextPosition,
    isDraftCompleted: false
  }
}

/**
 * Updates the draft state after a pick is made
 */
export async function updateDraftAfterPick(
  draftId: number,
  nextPosition: number | null,
  isDraftCompleted: boolean,
  shouldResetTimer: boolean = true
): Promise<void> {
  const updates: DraftUpdateData = {
    currentPositionOnClock: nextPosition,
    draftState: isDraftCompleted ? 'completed' : 'active'
  }

  // Reset timer for next player if draft continues
  if (nextPosition !== null && shouldResetTimer) {
    updates.turnStartedAt = getUtcNow()
  }

  await db.update(draftsInDa).set(updates).where(eq(draftsInDa.id, draftId))
}

/**
 * Updates the draft state after a pick is made (by GUID)
 */
export async function updateDraftAfterPickByGuid(
  draftGuid: string,
  nextPosition: number | null,
  isDraftCompleted: boolean,
  shouldResetTimer: boolean = true
): Promise<void> {
  const updates: DraftUpdateData = {
    currentPositionOnClock: nextPosition,
    draftState: isDraftCompleted ? 'completed' : 'active'
  }

  // Reset timer for next player if draft continues
  if (nextPosition !== null && shouldResetTimer) {
    updates.turnStartedAt = getUtcNow()
  }

  await db.update(draftsInDa).set(updates).where(eq(draftsInDa.guid, draftGuid))
}

/**
 * Verifies a user is a participant in the draft and returns their position (by GUID)
 */
export async function verifyParticipantByGuid(
  draftGuid: string,
  userId: string
): Promise<
  | { success: true; position: number | null }
  | { success: false; error: NextResponse }
> {
  const [draft] = await db
    .select({ id: draftsInDa.id })
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, draftGuid))

  if (!draft) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }
  }

  const [participant] = await db
    .select()
    .from(draftUsersInDa)
    .where(
      and(
        eq(draftUsersInDa.draftId, draft.id),
        eq(draftUsersInDa.userId, userId)
      )
    )

  if (!participant) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'You are not a participant in this draft' },
        { status: 403 }
      )
    }
  }

  return { success: true, position: participant.position }
}

/**
 * Verifies a user is a participant in the draft and returns their position
 */
export async function verifyParticipant(
  draftId: number,
  userId: string
): Promise<
  | { success: true; position: number | null }
  | { success: false; error: NextResponse }
> {
  const [participant] = await db
    .select()
    .from(draftUsersInDa)
    .where(
      and(
        eq(draftUsersInDa.draftId, draftId),
        eq(draftUsersInDa.userId, userId)
      )
    )

  if (!participant) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'You are not a participant in this draft' },
        { status: 403 }
      )
    }
  }

  return { success: true, position: participant.position }
}

/**
 * Gets all used payloads (for auto-pick logic) by GUID
 */
export async function getUsedPayloadsByGuid(
  draftGuid: string
): Promise<string[]> {
  const [draft] = await db
    .select({ id: draftsInDa.id })
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, draftGuid))

  if (!draft) {
    throw new Error('Draft not found')
  }

  const previousPicks = await db
    .select({ payload: draftSelectionsInDa.payload })
    .from(draftSelectionsInDa)
    .where(eq(draftSelectionsInDa.draftId, draft.id))

  return previousPicks.map(p => p.payload.toLowerCase())
}

/**
 * Gets all used payloads (for auto-pick logic)
 */
export async function getUsedPayloads(draftId: number): Promise<string[]> {
  const previousPicks = await db
    .select({ payload: draftSelectionsInDa.payload })
    .from(draftSelectionsInDa)
    .where(eq(draftSelectionsInDa.draftId, draftId))

  return previousPicks.map(p => p.payload.toLowerCase())
}
