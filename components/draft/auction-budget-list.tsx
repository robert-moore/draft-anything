'use client'

import { cn } from '@/lib/utils'
import type { Draft, DraftPick, Participant } from '@/types/draft'

interface AuctionBudgetListProps {
  draft: Draft
  participants: Participant[]
  picks: DraftPick[]
  className?: string
}

export function AuctionBudgetList({
  draft,
  participants,
  picks,
  className
}: AuctionBudgetListProps) {
  const starting = draft.startingBudget ?? 0

  return (
    <div className={cn('space-y-2', className)}>
      {[...participants]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map(participant => {
          const isHighlighted =
            draft.auctionPhase === 'bidding'
              ? participant.id === draft.auctionHighBidderId
              : participant.position === draft.currentPositionOnClock
          const pickCount = picks.filter(
            p => p.clientId === participant.id
          ).length
          const remaining = participant.remainingBudget ?? 0
          const pct =
            starting > 0
              ? Math.max(0, Math.min(100, (remaining / starting) * 100))
              : 0

          return (
            <div
              key={participant.id}
              className={cn(
                'px-3 py-2 text-sm',
                isHighlighted
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <div className="flex items-center justify-between gap-2 font-medium">
                <span className="truncate">
                  {participant.position}. {participant.name}
                </span>
                {isHighlighted && (
                  <span className="font-bold shrink-0">
                    {draft.auctionPhase === 'bidding' ? 'BID' : 'NOW'}
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-1 font-mono text-xs">
                <span>
                  ${remaining}
                  {starting > 0 ? ` / $${starting}` : ''}
                </span>
                <span>
                  {pickCount}/{draft.numRounds}
                </span>
              </div>
              <div
                className={cn(
                  'mt-1.5 h-2 border',
                  isHighlighted
                    ? 'border-accent-foreground/40 bg-accent-foreground/15'
                    : 'border-border bg-muted'
                )}
              >
                <div
                  className={cn(
                    'h-full',
                    isHighlighted ? 'bg-accent-foreground' : 'bg-foreground'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
    </div>
  )
}
