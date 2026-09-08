export const MIN_BUDGET = 10
export const MAX_BUDGET = 10000
export const DEFAULT_BUDGET = 200
export const MIN_BID = 1
export const MAX_NOMINATION_LENGTH = 300

export type AuctionPhase = 'nominating' | 'bidding'

export function minBudgetForRoster(numRounds: number): number {
  return Math.max(MIN_BUDGET, numRounds * MIN_BID)
}

export function rosterSpotsLeft(
  numRounds: number,
  pickCount: number
): number {
  return Math.max(0, numRounds - pickCount)
}

export function maxBidForPlayer(
  remainingBudget: number,
  spotsLeft: number
): number {
  if (spotsLeft <= 0) return 0
  return Math.max(0, remainingBudget - (spotsLeft - 1) * MIN_BID)
}

export function nextNominatorPosition(
  currentPosition: number,
  participants: Array<{ position: number | null; userId: string }>,
  pickCounts: Record<string, number>,
  numRounds: number
): number | null {
  const ordered = participants
    .filter(
      (p): p is { position: number; userId: string } =>
        p.position !== null && p.userId.length > 0
    )
    .sort((a, b) => a.position - b.position)

  if (ordered.length === 0) return null

  const startIndex = ordered.findIndex(p => p.position === currentPosition)
  const from = startIndex >= 0 ? startIndex : 0

  for (let i = 1; i <= ordered.length; i++) {
    const candidate = ordered[(from + i) % ordered.length]
    const picks = pickCounts[candidate.userId] ?? 0
    if (picks < numRounds) {
      return candidate.position
    }
  }

  return null
}

export function normalizeNomination(text: string): string {
  return text.trim()
}
