'use client'

import { useDraftTimer } from '@/hooks/use-draft-timer'
import { useEffect, useRef, useState } from 'react'

interface AutoPickMonitorProps {
  draftId: string
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
  const isDevelopment = process.env.NODE_ENV === 'development'
  const { isExpired, secondsLeft } = useDraftTimer({
    turnStartedAt,
    secondsPerRound
  })
  const [hasTriggered, setHasTriggered] = useState(false)
  const lastTurnStartedAtRef = useRef(turnStartedAt)
  const turnStartTimeRef = useRef<number | null>(null)


  useEffect(() => {
    if (turnStartedAt !== lastTurnStartedAtRef.current) {
      setHasTriggered(false)
      lastTurnStartedAtRef.current = turnStartedAt
      turnStartTimeRef.current = turnStartedAt
        ? new Date(turnStartedAt).getTime()
        : null
    }
  }, [turnStartedAt])

  useEffect(() => {
    if (isDevelopment) {
      return
    }

    if (secondsPerRound === 0) {
      return
    }

    if (!isExpired) {
      return
    }

    if (hasTriggered) {
      return
    }

    if (turnStartTimeRef.current) {
      const elapsedSinceTurnStart = Date.now() - turnStartTimeRef.current
      const minDelayMs = 5000

      if (elapsedSinceTurnStart < minDelayMs) {
        return
      }
    }

    setHasTriggered(true)

    const attemptAutoPick = async () => {
      try {
        const response = await fetch(`/api/drafts/${draftId}/check-auto-pick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
        } else {
          const errorData = await response.json()
          setHasTriggered(false)
        }
      } catch (error) {
        console.error('Auto-pick error:', error)
        setHasTriggered(false)
      }
    }

    const delay = isMyTurn ? 500 : 1000
    const timeout = setTimeout(attemptAutoPick, delay)

    return () => clearTimeout(timeout)
  }, [
    isExpired,
    secondsLeft,
    secondsPerRound,
    draftId,
    isMyTurn,
    turnStartedAt
  ])

  return null
}
