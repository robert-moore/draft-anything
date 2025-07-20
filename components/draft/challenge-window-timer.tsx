'use client'

import { BrutalSection } from '@/components/ui/brutal-section'
import { useEffect, useState } from 'react'

interface ChallengeWindowTimerProps {
  startTime: string
  durationSeconds: number
  onTimeout: () => void
  isLastPickByCurrentUser?: boolean
}

export function ChallengeWindowTimer({
  startTime,
  durationSeconds,
  onTimeout,
  isLastPickByCurrentUser = false
}: ChallengeWindowTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds)

  useEffect(() => {
    const startTimestamp = new Date(startTime).getTime()
    const endTimestamp = startTimestamp + durationSeconds * 1000

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((endTimestamp - now) / 1000))

      setTimeRemaining(remaining)

      if (remaining <= 0) {
        onTimeout()
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startTime, durationSeconds, onTimeout])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  return (
    <BrutalSection
      variant="bordered"
      className="mb-2 max-w-2xl mx-auto"
      background="diagonal"
    >
      <div className="p-4 text-center">
        <div className="text-2xl font-bold text-foreground mb-2">
          {minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          {isLastPickByCurrentUser
            ? 'Your pick can be challenged. The draft will end if no challenge is made.'
            : 'You have a chance to challenge the pick. The draft will end if no challenge is made.'}
        </div>
        <div className="w-full bg-muted h-2 border-2 border-border overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${(timeRemaining / durationSeconds) * 100}%`
            }}
          />
        </div>
      </div>
    </BrutalSection>
  )
}
