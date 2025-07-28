import { draftUsersInDa, draftsInDa } from '@/drizzle/schema'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'

export type UserOrGuest =
  | { type: 'user'; id: string }
  | { type: 'guest'; id: string }
  | null

/**
 * Get current user or validate guest client ID for a specific draft
 */
export async function getCurrentUserOrGuest(
  draftId: number,
  request: NextRequest
): Promise<UserOrGuest> {
  // Try authenticated user first
  const user = await getCurrentUser()
  if (user) {
    return { type: 'user', id: user.id }
  }

  // Try guest client ID
  const clientId = request.headers.get('x-client-id')
  if (clientId) {
    // First check if they're a joined guest participant
    const isValidGuest = await validateGuestInDraft(draftId, clientId)
    if (isValidGuest) {
      return { type: 'guest', id: clientId }
    }

    // If not a joined participant, check if they're the admin who created the draft
    const [draft] = await db
      .select({ adminUserId: draftsInDa.adminUserId })
      .from(draftsInDa)
      .where(eq(draftsInDa.id, draftId))
      .limit(1)

    if (draft && draft.adminUserId === clientId) {
      return { type: 'guest', id: clientId }
    }
  }

  return null
}

/**
 * Validate that a client ID exists as a guest in the specified draft
 */
export async function validateGuestInDraft(
  draftId: number,
  clientId: string
): Promise<boolean> {
  try {
    const [guest] = await db
      .select({ id: draftUsersInDa.userId })
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draftId),
          eq(draftUsersInDa.userId, clientId),
          eq(draftUsersInDa.isGuest, true)
        )
      )
      .limit(1)

    return !!guest
  } catch (error) {
    console.error('Error validating guest:', error)
    return false
  }
}

/**
 * Get guest information from draft_users table
 */
export async function getGuestInfo(draftId: number, clientId: string) {
  try {
    const [guest] = await db
      .select({
        userId: draftUsersInDa.userId,
        draftUsername: draftUsersInDa.draftUsername,
        position: draftUsersInDa.position,
        isReady: draftUsersInDa.isReady,
        createdAt: draftUsersInDa.createdAt
      })
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draftId),
          eq(draftUsersInDa.userId, clientId),
          eq(draftUsersInDa.isGuest, true)
        )
      )
      .limit(1)

    return guest || null
  } catch (error) {
    console.error('Error getting guest info:', error)
    return null
  }
}
