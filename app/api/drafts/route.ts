import { draftCuratedOptionsInDa, draftsInDa } from '@/drizzle/schema'
import { parseJsonRequest } from '@/lib/api/validation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for creating a draft
const createDraftSchema = z
  .object({
    name: z.string().min(1, 'Draft name is required').max(100),
    maxDrafters: z.number().int().min(2).max(20),
    secPerRound: z.number().int(),
    numRounds: z.number().int().min(1).max(20),
    isFreeform: z.boolean().default(true),
    curatedOptions: z.string().optional(),
    draftState: z
      .enum(['setting_up', 'active', 'completed', 'paused'])
      .optional(),
    timerMode: z.enum(['timed', 'untimed']).optional()
  })
  .superRefine((data, ctx) => {
    // If timerMode is untimed or secPerRound is 0, allow 0
    // If timerMode is timed, secPerRound must be between 30 and 300
    // For backward compatibility, infer timerMode from secPerRound
    const isUntimed = data.timerMode === 'untimed' || data.secPerRound === 0
    if (isUntimed) {
      if (data.secPerRound !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'For untimed drafts, secPerRound must be 0.'
        })
      }
    } else {
      if (
        typeof data.secPerRound !== 'number' ||
        data.secPerRound < 30 ||
        data.secPerRound > 300
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Seconds per pick must be between 30 and 300 for timed drafts.'
        })
      }
    }
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
    const {
      name,
      draftState,
      maxDrafters,
      secPerRound,
      numRounds,
      isFreeform,
      curatedOptions
    } = bodyResult.data

    // Validate curated options if provided
    if (!isFreeform && curatedOptions) {
      const options = curatedOptions.split('\n').filter(line => line.trim())
      if (options.length === 0) {
        return NextResponse.json(
          { error: 'At least one curated option is required' },
          { status: 400 }
        )
      }
      if (options.length > 1000) {
        return NextResponse.json(
          { error: 'Maximum 1000 curated options allowed' },
          { status: 400 }
        )
      }
      // Check character limit for each option (let's say 200 chars)
      for (const option of options) {
        if (option.length > 200) {
          return NextResponse.json(
            { error: 'Each option must be 200 characters or less' },
            { status: 400 }
          )
        }
      }

      // Check if there are enough options for the draft
      const totalPicks = maxDrafters * numRounds
      if (options.length < totalPicks) {
        return NextResponse.json(
          {
            error: `Not enough options. You need at least ${totalPicks} options for ${maxDrafters} players × ${numRounds} rounds, but only provided ${options.length} options.`
          },
          { status: 400 }
        )
      }
    }

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
        isFreeform,
        createdAt: new Date().toISOString()
      })
      .returning()

    // Create curated options if provided
    if (!isFreeform && curatedOptions) {
      const options = curatedOptions.split('\n').filter(line => line.trim())
      const curatedOptionsData = options.map(option => ({
        draftId: newDraft.id,
        optionText: option.trim(),
        createdAt: new Date().toISOString()
      }))

      await db.insert(draftCuratedOptionsInDa).values(curatedOptionsData)
    }

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
