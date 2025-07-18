import { NextResponse } from 'next/server'
import { ZodError, ZodType } from 'zod'

export function parseRequest<Output, Input = Output>(
  schema: ZodType<Output, any, Input>,
  data: unknown
): { success: true; data: Output } | { success: false; error: NextResponse } {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation error',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        )
      }
    }
    
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
  }
}

export async function parseJsonRequest<Output, Input = Output>(
  request: Request,
  schema: ZodType<Output, any, Input>
): Promise<{ success: true; data: Output } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json()
    return parseRequest(schema, body)
  } catch {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }
  }
}