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
  // Disable auto-pick in development mode
  const isDevelopment = process.env.NODE_ENV === 'development'
  const { isExpired, secondsLeft } = useDraftTimer({
    turnStartedAt,
    secondsPerRound
  })
  const [hasTriggered, setHasTriggered] = useState(false)
  const lastTurnStartedAtRef = useRef(turnStartedAt)
  const turnStartTimeRef = useRef<number | null>(null)

  // Debug when hasTriggered changes
  useEffect(() => {
    // Removed logging
  }, [hasTriggered])

  useEffect(() => {
    // Reset when turn changes (new turnStartedAt timestamp)
    if (turnStartedAt !== lastTurnStartedAtRef.current) {
      setHasTriggered(false)
      lastTurnStartedAtRef.current = turnStartedAt
      turnStartTimeRef.current = turnStartedAt
        ? new Date(turnStartedAt).getTime()
        : null
    }
  }, [turnStartedAt])

  useEffect(() => {
    // Disable auto-pick in development mode
    if (isDevelopment) {
      return
    }

    // Only check for auto-pick if timer is enabled
    if (secondsPerRound === 0) {
      return
    }

    // Only trigger auto-pick when timer is actually expired (isExpired = true)
    if (!isExpired) {
      return
    }

    // Check if we've already triggered for this turn
    if (hasTriggered) {
      return
    }

    // Check if at least 5 seconds have passed since turn started
    if (turnStartTimeRef.current) {
      const elapsedSinceTurnStart = Date.now() - turnStartTimeRef.current
      const minDelayMs = 5000 // 5 seconds

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
          // Keep hasTriggered true on success to prevent duplicate calls
        } else {
          const errorData = await response.json()
          // If the backend check failed (e.g., pick already made), reset the trigger
          setHasTriggered(false)
        }
      } catch (error) {
        console.error('Auto-pick error:', error)
        // Reset trigger on error
        setHasTriggered(false)
      }
    }

    // Longer delay to prevent rapid successive calls
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
