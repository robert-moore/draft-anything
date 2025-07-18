/**
 * Get current UTC timestamp as ISO string
 */
export function getUtcNow(): string {
  return new Date().toISOString()
}

/**
 * Calculate seconds elapsed between a timestamp and now
 */
export function getElapsedSeconds(startTimestamp: string): number {
  const elapsed = Math.floor((Date.now() - new Date(startTimestamp).getTime()) / 1000)
  return Math.max(0, elapsed)
}