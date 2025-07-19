import { draftsInDa } from '@/drizzle/schema'
import { parseJsonRequest } from '@/lib/api/validation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for creating a draft
const createDraftSchema = z.object({
  name: z.string().min(1, 'Draft name is required').max(100),
  maxDrafters: z.number().int().min(2).max(20),
  secPerRound: z.number().int().min(0).max(300),
  numRounds: z.number().int().min(1).max(10),
  draftState: z.enum(['setting_up', 'active', 'completed', 'paused']).optional()
})

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate request body
    const bodyResult = await parseJsonRequest(req, createDraftSchema)
    if (!bodyResult.success) return bodyResult.error
    const { name, draftState, maxDrafters, secPerRound, numRounds } =
      bodyResult.data

    const [newDraft] = await db
      .insert(draftsInDa)
      .values({
        guid: randomUUID(),
        name,
        adminUserId: user.id,
        draftState: draftState || 'setting_up',
        maxDrafters,
        secPerRound: secPerRound.toString(),
        numRounds,
        createdAt: new Date().toISOString()
      })
      .returning()

    return NextResponse.json({ draft: newDraft }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get all drafts (you might want to add pagination or filtering later)
    const allDrafts = await db.select().from(draftsInDa)

    return NextResponse.json(allDrafts)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
