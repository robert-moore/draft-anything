'use client'

import { useDraftTimer } from '@/hooks/use-draft-timer'
import { useEffect, useRef } from 'react'

interface AuctionMonitorProps {
  draftId: string
  turnStartedAt: string | null
  secondsPerRound: number
}

export function AuctionMonitor({
  draftId,
  turnStartedAt,
  secondsPerRound
}: AuctionMonitorProps) {
  const { isExpired } = useDraftTimer({
    turnStartedAt,
    secondsPerRound
  })
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (secondsPerRound === 0 || !isExpired || !turnStartedAt) return

    const attemptResolve = async () => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      try {
        await fetch(`/api/drafts/${draftId}/resolve-auction`, {
          method: 'POST'
        })
      } finally {
        inFlightRef.current = false
      }
    }

    void attemptResolve()
    const interval = setInterval(attemptResolve, 2000)

    return () => clearInterval(interval)
  }, [isExpired, secondsPerRound, draftId, turnStartedAt])

  return null
}
