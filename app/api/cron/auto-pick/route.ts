import { autoPickScheduler } from '@/lib/auto-pick-scheduler'

export async function GET() {
  await autoPickScheduler.checkExpiredTimers()
  return new Response('Auto-pick check complete')
}
