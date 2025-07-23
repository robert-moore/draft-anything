import { draftsInDa } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { getElapsedSeconds } from '@/lib/time-utils'
import { and, eq, gt } from 'drizzle-orm'

// Simple in-memory scheduler for auto-picks
class AutoPickScheduler {
  private interval: NodeJS.Timeout | null = null
  private isRunning = false
  private lastCheckTime = 0
  private readonly CHECK_INTERVAL = 10000 // Check every 10 seconds to reduce load
  private errorCount = 0
  private readonly MAX_ERRORS = 5

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.errorCount = 0

    // Check for expired timers every 10 seconds (reduced frequency)
    this.interval = setInterval(async () => {
      try {
        await this.checkExpiredTimers()
        // Reset error count on successful check
        this.errorCount = 0
      } catch (error) {
        this.errorCount++
        console.error(
          `Auto-pick scheduler error (${this.errorCount}/${this.MAX_ERRORS}):`,
          error
        )

        // Stop the scheduler on critical errors or too many consecutive errors
        if (
          (error instanceof Error && error.message.includes('53300')) ||
          this.errorCount >= this.MAX_ERRORS
        ) {
          console.error(
            'Database connection limit reached or too many errors, stopping scheduler'
          )
          this.stop()

          // Try to restart after a delay
          setTimeout(() => {
            this.start()
          }, 30000) // Wait 30 seconds before restarting
        }
      }
    }, this.CHECK_INTERVAL)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.isRunning = false
  }

  // Made public for testing
  async checkExpiredTimers() {
    try {
      const now = Date.now()

      // Prevent overlapping checks
      if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
        return
      }

      this.lastCheckTime = now

      // Find all active drafts with timers that have expired
      const activeDrafts = await db
        .select({
          id: draftsInDa.id,
          guid: draftsInDa.guid,
          secPerRound: draftsInDa.secPerRound,
          turnStartedAt: draftsInDa.turnStartedAt,
          currentPositionOnClock: draftsInDa.currentPositionOnClock,
          isFreeform: draftsInDa.isFreeform
        })
        .from(draftsInDa)
        .where(
          and(
            eq(draftsInDa.draftState, 'active'),
            gt(draftsInDa.secPerRound, '0') // Only timed drafts
            // turnStartedAt is not null (handled by the next check)
          )
        )
        .limit(100) // Increased from 5 to handle more drafts per cycle

      if (activeDrafts.length === 0) {
        return // No active drafts to check
      }

      for (const draft of activeDrafts) {
        if (!draft.turnStartedAt) continue

        const elapsedSeconds = getElapsedSeconds(draft.turnStartedAt)
        const secPerRound = parseInt(draft.secPerRound)

        // Check if timer has expired (with 1 second buffer)
        if (elapsedSeconds >= secPerRound + 1) {
          // Trigger auto-pick for this draft
          await this.performAutoPick(draft)

          // Add a delay between auto-picks to prevent connection overload
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    } catch (error) {
      console.error('Error checking expired timers:', error)
      throw error // Re-throw to be handled by the interval
    }
  }

  private async performAutoPick(draft: any) {
    try {
      // Import the auto-pick logic from the existing route
      const { performAutoPickForDraft } = await import('@/lib/auto-pick-logic')
      await performAutoPickForDraft(draft.guid)
    } catch (error) {
      console.error(
        `Error performing auto-pick for draft ${draft.guid}:`,
        error
      )
    }
  }
}

// Create singleton instance
const autoPickScheduler = new AutoPickScheduler()

export { autoPickScheduler }
