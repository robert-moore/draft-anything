import { parseJsonRequest } from '@/lib/api/validation'
import { findDraftByJoinCode } from '@/lib/utils/join-code'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for joining a draft by code
const joinByCodeSchema = z.object({
  joinCode: z.string().length(4, 'Join code must be 4 digits')
})

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const bodyResult = await parseJsonRequest(req, joinByCodeSchema)
    if (!bodyResult.success) return bodyResult.error
    const { joinCode } = bodyResult.data

    // Find draft by join code
    const draft = await findDraftByJoinCode(joinCode)
    if (!draft) {
      return NextResponse.json(
        { error: "The draft is done or doesn't exist." },
        { status: 404 }
      )
    }

    // Check if draft is completed
    if (draft.draftState === 'completed') {
      return NextResponse.json(
        { error: "The draft is done or doesn't exist." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      draft: {
        id: draft.id,
        guid: draft.guid,
        name: draft.name,
        draftState: draft.draftState,
        maxDrafters: draft.maxDrafters,
        secPerRound: draft.secPerRound,
        numRounds: draft.numRounds,
        isFreeform: draft.isFreeform
      }
    })
  } catch (err: any) {
    console.error('❌ Error joining draft by code:', err)
    return NextResponse.json({ error: 'Failed to join draft' }, { status: 500 })
  }
}
