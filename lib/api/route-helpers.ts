import { NextResponse } from 'next/server'
import { z } from 'zod'

// Simple helper for parsing draft ID from route params
export async function parseDraftId(
  context: { params: Promise<{ id: string }> }
): Promise<{ success: true; draftId: number } | { success: false; error: NextResponse }> {
  try {
    const { id } = await context.params
    const draftId = parseInt(id, 10)
    
    if (isNaN(draftId) || draftId <= 0) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Invalid draft ID' },
          { status: 400 }
        )
      }
    }
    
    return { success: true, draftId }
  } catch {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid draft ID' },
        { status: 400 }
      )
    }
  }
}

// Alternative: Create a reusable context schema if you have multiple route params
export const createRouteContext = <T extends Record<string, z.ZodType>>(paramsSchema: T) => {
  return {
    parse: async (context: { params: Promise<any> }) => {
      const params = await context.params
      const schema = z.object(paramsSchema)
      const result = schema.safeParse(params)
      
      if (!result.success) {
        return {
          success: false as const,
          error: NextResponse.json(
            {
              error: 'Invalid route parameters',
              details: result.error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            },
            { status: 400 }
          )
        }
      }
      
      return { success: true as const, data: result.data }
    }
  }
}