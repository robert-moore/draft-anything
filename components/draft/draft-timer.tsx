'use client'

import { useDraftTimer } from '@/hooks/use-draft-timer'
import { Timer, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DraftTimerProps {
  turnStartedAt: string | null
  secondsPerRound: number
  isPaused?: boolean
  variant?: 'compact' | 'full'
  className?: string
}

export function DraftTimer({ 
  turnStartedAt, 
  secondsPerRound, 
  isPaused = false,
  variant = 'compact',
  className 
}: DraftTimerProps) {
  const { formatted, color, percentage, secondsLeft, isUntimed } = useDraftTimer({
    turnStartedAt,
    secondsPerRound,
    isPaused
  })

  if (!turnStartedAt) return null

  const colorClasses: Record<string, string> = {
    red: 'text-red-500',
    yellow: 'text-yellow-500', 
    green: 'text-green-500',
    default: 'text-muted-foreground'
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isUntimed ? (
          <Clock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Timer className={cn('w-4 h-4', colorClasses[color])} />
        )}
        <span className={cn('font-mono font-medium', colorClasses[color])}>
          {formatted}
        </span>
      </div>
    )
  }

  // Full variant with circle (only for timed drafts)
  if (!isUntimed) {
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className={cn('relative', className)}>
        <svg width="100" height="100" className="transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted-foreground/20"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className={cn('transition-all duration-100', colorClasses[color])}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={cn('text-2xl font-bold font-mono', colorClasses[color])}>
              {formatted}
            </div>
            {secondsLeft <= 10 && secondsLeft > 0 && (
              <div className="text-xs text-muted-foreground animate-pulse">
                Hurry up!
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Full variant for untimed drafts (simpler display)
  return (
    <div className={cn('border-2 border-muted-foreground/20 rounded-lg p-4 inline-flex items-center gap-3', className)}>
      <Clock className="w-6 h-6 text-muted-foreground" />
      <div>
        <div className="text-2xl font-bold font-mono text-muted-foreground">
          {formatted}
        </div>
        <div className="text-xs text-muted-foreground">
          Elapsed
        </div>
      </div>
    </div>
  )
}