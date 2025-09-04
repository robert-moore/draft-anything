import {
  draftCuratedOptionsInDa,
  draftSelectionsInDa,
  draftUsersInDa,
  draftsInDa
} from '@/drizzle/schema'
import { db } from '@/lib/db'
import { getUtcNow } from '@/lib/time-utils'
import { and, eq } from 'drizzle-orm'

export interface CreatePickOptions {
  draft: {
    id: number
    guid: string
    currentPositionOnClock: number | null
    numRounds: number
    isFreeform: boolean
  }
  userId: string
  pickNumber: number
  payload?: string | null
  curatedOptionId?: number | null
  wasAutoPick?: boolean
  timeTakenSeconds?: number | null
  skipTurnValidation?: boolean
}

export interface CreatePickResult {
  success: boolean
  error?: string
  pick?: {
    pickNumber: number
    userId: string
    payload: string | null
    curatedOptionId: number | null
    createdAt: string
  }
}

/**
 * Core logic for creating a pick in the draft
 * Used by both the API route and autopick logic
 */
export async function createPick(options: CreatePickOptions): Promise<CreatePickResult> {
  const {
    draft,
    userId,
    pickNumber,
    payload = null,
    curatedOptionId = null,
    wasAutoPick = false,
    timeTakenSeconds = null,
    skipTurnValidation = false
  } = options

  try {
    // Validate turn (unless autopick with skip flag)
    if (!skipTurnValidation) {
      // Get user's position
      const [draftUser] = await db
        .select()
        .from(draftUsersInDa)
        .where(
          and(
            eq(draftUsersInDa.draftId, draft.id),
            eq(draftUsersInDa.userId, userId)
          )
        )
      
      if (!draftUser) {
        return {
          success: false,
          error: 'User is not a participant in this draft'
        }
      }

      if (draftUser.position !== draft.currentPositionOnClock) {
        return {
          success: false,
          error: `It's not your turn. Player with position ${draft.currentPositionOnClock} is on the clock.`
        }
      }
    }

    // Validate and mark curated option as used
    if (curatedOptionId) {
      const [curatedOption] = await db
        .select()
        .from(draftCuratedOptionsInDa)
        .where(eq(draftCuratedOptionsInDa.id, curatedOptionId))

      if (!curatedOption) {
        return {
          success: false,
          error: 'Invalid curated option ID'
        }
      }

      if (curatedOption.isUsed) {
        return {
          success: false,
          error: 'This option has already been selected'
        }
      }

      // Mark the option as used
      await db
        .update(draftCuratedOptionsInDa)
        .set({ isUsed: true })
        .where(eq(draftCuratedOptionsInDa.id, curatedOptionId))
    }

    // Insert the pick
    const now = getUtcNow()
    const [insertedPick] = await db
      .insert(draftSelectionsInDa)
      .values({
        draftId: draft.id,
        userId,
        pickNumber,
        payload,
        curatedOptionId,
        createdAt: now,
        wasAutoPick,
        timeTakenSeconds: timeTakenSeconds?.toString() || null
      })
      .returning()

    return {
      success: true,
      pick: {
        pickNumber: insertedPick.pickNumber,
        userId: insertedPick.userId,
        payload: insertedPick.payload,
        curatedOptionId: insertedPick.curatedOptionId,
        createdAt: insertedPick.createdAt
      }
    }
  } catch (error) {
    console.error('Error creating pick:', error)
    return {
      success: false,
      error: 'Failed to create pick'
    }
  }
}

