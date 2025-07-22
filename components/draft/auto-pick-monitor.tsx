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
    console.log('Auto-pick: hasTriggered changed to:', hasTriggered)
  }, [hasTriggered])

  useEffect(() => {
    // Reset when turn changes (new turnStartedAt timestamp)
    if (turnStartedAt !== lastTurnStartedAtRef.current) {
      console.log('Auto-pick: Turn changed, resetting trigger', {
        oldTurnStartedAt: lastTurnStartedAtRef.current,
        newTurnStartedAt: turnStartedAt
      })
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
      console.log('Auto-pick: Skipping - disabled in development mode')
      return
    }

    // Only check for auto-pick if timer is enabled
    if (secondsPerRound === 0) {
      console.log('Auto-pick: Skipping - untimed draft')
      return
    }

    console.log('Auto-pick: Checking timer state', {
      isExpired,
      secondsLeft,
      secondsPerRound,
      hasTriggered
    })

    // Only trigger auto-pick when timer is actually expired (isExpired = true)
    if (!isExpired) {
      console.log('Auto-pick: Timer not expired yet')
      return
    }

    // Check if we've already triggered for this turn
    if (hasTriggered) {
      console.log('Auto-pick: Already triggered for this turn')
      return
    }

    // Check if at least 5 seconds have passed since turn started
    if (turnStartTimeRef.current) {
      const elapsedSinceTurnStart = Date.now() - turnStartTimeRef.current
      const minDelayMs = 5000 // 5 seconds

      if (elapsedSinceTurnStart < minDelayMs) {
        console.log('Auto-pick: Not enough time passed since turn started', {
          elapsedSinceTurnStart,
          minDelayMs,
          remaining: minDelayMs - elapsedSinceTurnStart
        })
        return
      }
    }

    console.log('Auto-pick: Timer expired, triggering auto-pick')
    setHasTriggered(true)

    const attemptAutoPick = async () => {
      try {
        console.log(
          'Auto-pick: Checking backend auto-pick for draft',
          draftId,
          'secondsLeft:',
          secondsLeft,
          'isExpired:',
          isExpired
        )
        const response = await fetch(`/api/drafts/${draftId}/check-auto-pick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Auto-pick: Backend response:', data.message)
          // Keep hasTriggered true on success to prevent duplicate calls
        } else {
          const errorData = await response.json()
          console.log('Auto-pick: Backend check failed:', errorData)
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
