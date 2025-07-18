'use client'

import { useDraftTimer } from '@/hooks/use-draft-timer'
import { useEffect, useRef } from 'react'

interface AutoPickMonitorProps {
  draftId: number
  turnStartedAt: string | null
  secondsPerRound: number
  isMyTurn: boolean
  currentPickNumber: number
}

export function AutoPickMonitor({
  draftId,
  turnStartedAt,
  secondsPerRound,
  isMyTurn,
  currentPickNumber
}: AutoPickMonitorProps) {
  const { isExpired } = useDraftTimer({ turnStartedAt, secondsPerRound })
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    // Reset when turn changes
    hasTriggeredRef.current = false
  }, [currentPickNumber])

  useEffect(() => {
    if (!isExpired || hasTriggeredRef.current) return

    hasTriggeredRef.current = true

    // Delay based on role: 1s for current player, 5s for backup
    const delay = isMyTurn ? 1000 : 5000

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/drafts/${draftId}/auto-pick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedPickNumber: currentPickNumber })
        })

        if (!response.ok && !response.text().then(t => t.includes('already'))) {
          console.error('Auto-pick failed')
        }
      } catch (error) {
        console.error('Auto-pick error:', error)
      }
    }, delay)

    return () => clearTimeout(timeout)
  }, [isExpired, draftId, isMyTurn, currentPickNumber])

  return null
}
