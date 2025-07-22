import { autoPickScheduler } from '@/lib/auto-pick-scheduler'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Test: Manually triggering auto-pick scheduler check')

    // Manually trigger the scheduler check
    await autoPickScheduler.checkExpiredTimers()

    return NextResponse.json({
      message: 'Auto-pick scheduler check completed'
    })
  } catch (error) {
    console.error('Error testing auto-pick scheduler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
