import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * Get draft by GUID
 */
export async function getDraftByGuid(guid: string) {
  const [draft] = await db
    .select()
    .from(draftsInDa)
    .where(eq(draftsInDa.guid, guid))
    .limit(1)

  return draft || null
}

/**
 * Validate GUID format
 */
export function isValidGuid(guid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(guid)
}

/**
 * Parse draft GUID from route params
 */
export async function parseDraftGuid(context: {
  params: Promise<{ id: string }>
}): Promise<
  { success: true; draftGuid: string } | { success: false; error: NextResponse }
> {
  try {
    const { id } = await context.params

    if (!isValidGuid(id)) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Invalid draft ID format' },
          { status: 400 }
        )
      }
    }

    return { success: true, draftGuid: id }
  } catch {
    return {
      success: false,
      error: NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 })
    }
  }
}
