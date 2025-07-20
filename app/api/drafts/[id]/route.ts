import {
  draftCuratedOptionsInDa,
  draftSelectionsInDa,
  draftUsersInDa,
  profilesInDa
} from '@/drizzle/schema'
import { getDraftByGuid, parseDraftGuid } from '@/lib/api/draft-guid-helpers'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    // Get draft details by GUID
    const draft = await getDraftByGuid(draftGuid)

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const isAdmin = draft?.adminUserId === user.id

    // Get participants
    const participantsQuery = await db
      .select({
        id: profilesInDa.id,
        name: draftUsersInDa.draftUsername,
        position: draftUsersInDa.position,
        isReady: draftUsersInDa.isReady,
        createdAt: draftUsersInDa.createdAt
      })
      .from(draftUsersInDa)
      .innerJoin(profilesInDa, eq(draftUsersInDa.userId, profilesInDa.id))
      .where(eq(draftUsersInDa.draftId, draft.id))

    // Get draft picks with user names in a single query
    const picksQuery = await db
      .select({
        pickNumber: draftSelectionsInDa.pickNumber,
        userId: draftSelectionsInDa.userId,
        payload: draftSelectionsInDa.payload,
        createdAt: draftSelectionsInDa.createdAt,
        userName: draftUsersInDa.draftUsername,
        wasAutoPick: draftSelectionsInDa.wasAutoPick,
        timeTakenSeconds: draftSelectionsInDa.timeTakenSeconds,
        curatedOptionId: draftSelectionsInDa.curatedOptionId
      })
      .from(draftSelectionsInDa)
      .innerJoin(
        draftUsersInDa,
        eq(draftSelectionsInDa.userId, draftUsersInDa.userId)
      )
      .where(
        and(
          eq(draftSelectionsInDa.draftId, draft.id),
          eq(draftUsersInDa.draftId, draft.id)
        )
      )

    // Get curated options if draft is not freeform
    let curatedOptions: Array<{
      id: number
      optionText: string
      isUsed: boolean
    }> = []
    if (!draft.isFreeform) {
      curatedOptions = await db
        .select({
          id: draftCuratedOptionsInDa.id,
          optionText: draftCuratedOptionsInDa.optionText,
          isUsed: draftCuratedOptionsInDa.isUsed
        })
        .from(draftCuratedOptionsInDa)
        .where(eq(draftCuratedOptionsInDa.draftId, draft.id))
    }

    // Transform picks to include clientId and clientName for backward compatibility
    const picks = picksQuery.map(pick => {
      // For curated options, resolve the option text
      let finalPayload = pick.payload
      if (pick.curatedOptionId && !pick.payload) {
        const curatedOption = curatedOptions.find(
          option => option.id === pick.curatedOptionId
        )
        if (curatedOption) {
          finalPayload = curatedOption.optionText
        }
      }

      return {
        pickNumber: pick.pickNumber,
        userId: pick.userId,
        payload: finalPayload,
        createdAt: pick.createdAt,
        clientId: pick.userId, // For backward compatibility
        clientName: pick.userName || 'Unknown',
        wasAutoPick: pick.wasAutoPick,
        timeTakenSeconds: pick.timeTakenSeconds
      }
    })

    return NextResponse.json({
      draft,
      participants: participantsQuery,
      picks: picks.sort((a, b) => a.pickNumber - b.pickNumber),
      currentUser: user,
      isAdmin,
      curatedOptions
    })
  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
