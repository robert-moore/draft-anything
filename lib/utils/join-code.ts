import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'

/**
 * Generates a random 4-digit code
 */
function generateRandomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Generates a unique 4-digit join code that doesn't exist in the database
 */
export async function generateUniqueJoinCode(): Promise<string> {
  let code: string
  let attempts = 0
  const maxAttempts = 100

  do {
    code = generateRandomCode()
    attempts++

    // Check if this code already exists
    const existingDraft = await db
      .select({ id: draftsInDa.id })
      .from(draftsInDa)
      .where(eq(draftsInDa.joinCode, code))
      .limit(1)

    if (existingDraft.length === 0) {
      return code
    }
  } while (attempts < maxAttempts)

  throw new Error('Failed to generate unique join code after maximum attempts')
}

/**
 * Finds a draft by join code
 */
export async function findDraftByJoinCode(joinCode: string) {
  const draft = await db
    .select()
    .from(draftsInDa)
    .where(eq(draftsInDa.joinCode, joinCode))
    .limit(1)

  return draft[0] || null
}

/**
 * Clears the join code for a draft (sets to null)
 */
export async function clearJoinCode(draftId: number) {
  await db
    .update(draftsInDa)
    .set({ joinCode: null })
    .where(eq(draftsInDa.id, draftId))
}
