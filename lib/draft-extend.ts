export const EXTEND_WINDOW_MS = 24 * 60 * 60 * 1000
export const MIN_EXTRA_ROUNDS = 1
export const MAX_EXTRA_ROUNDS = 10
export const MAX_TOTAL_ROUNDS = 100
export const MAX_CURATED_OPTIONS = 1000
export const MAX_OPTION_LENGTH = 200

export function isWithinExtendWindow(
  lastPickCreatedAt: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!lastPickCreatedAt) return false
  const completedAt = new Date(lastPickCreatedAt).getTime()
  if (Number.isNaN(completedAt)) return false
  return nowMs - completedAt < EXTEND_WINDOW_MS
}

export function parseCuratedOptionLines(text: string | undefined): string[] {
  if (!text) return []
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export function extraPicksNeeded(
  extraRounds: number,
  participantCount: number
): number {
  return extraRounds * participantCount
}

export function maxExtraRoundsAllowed(args: {
  currentNumRounds: number
  participantCount: number
  isFreeform: boolean
  unusedOptionCount: number
  additionalOptionCount?: number
}): number {
  const remainingRoundCap = Math.max(
    0,
    MAX_TOTAL_ROUNDS - args.currentNumRounds
  )
  const byCap = Math.min(MAX_EXTRA_ROUNDS, remainingRoundCap)

  if (args.isFreeform || args.participantCount <= 0) {
    return byCap
  }

  const availableOptions =
    args.unusedOptionCount + (args.additionalOptionCount ?? 0)
  const byOptions = Math.floor(availableOptions / args.participantCount)

  return Math.min(byCap, byOptions)
}
