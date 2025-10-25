'use client'

import { useDraftTimer } from '@/hooks/use-draft-timer'
import { useEffect, useRef, useState } from 'react'

interface AutoPickMonitorProps {
  draftId: string
  turnStartedAt: string | null
  secondsPerRound: number
  isMyTurn: boolean
  currentPickNumber: number
  autopickEnabled?: boolean
}

export function AutoPickMonitor({
  draftId,
  turnStartedAt,
  secondsPerRound,
  isMyTurn,
  currentPickNumber,
  autopickEnabled
}: AutoPickMonitorProps) {
  const { isExpired, secondsLeft } = useDraftTimer({
    turnStartedAt,
    secondsPerRound
  })
  const [hasTriggered, setHasTriggered] = useState(false)
  const lastTurnStartedAtRef = useRef(turnStartedAt)
  const lastPickNumberRef = useRef(currentPickNumber)
  const turnStartTimeRef = useRef<number | null>(null)

  // Reset hasTriggered when pick number changes (handles consecutive turns)
  useEffect(() => {
    if (currentPickNumber !== lastPickNumberRef.current) {
      setHasTriggered(false)
      lastPickNumberRef.current = currentPickNumber
    }
  }, [currentPickNumber])

  // Update turn timing when turnStartedAt changes
  useEffect(() => {
    if (turnStartedAt !== lastTurnStartedAtRef.current) {
      setHasTriggered(false)
      lastTurnStartedAtRef.current = turnStartedAt
      turnStartTimeRef.current = turnStartedAt
        ? new Date(turnStartedAt).getTime()
        : null
    }
  }, [turnStartedAt])

  // Immediate autopick when it's user's turn and autopick is enabled
  useEffect(() => {
    if (!isMyTurn || !autopickEnabled || hasTriggered) return

    const attemptAutoPick = async () => {
      try {
        const response = await fetch(`/api/drafts/${draftId}/check-auto-pick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          setHasTriggered(false)
        }
      } catch (error) {
        console.error('Autopick error:', error)
        setHasTriggered(false)
      }
    }

    // Fire immediately
    setHasTriggered(true)
    attemptAutoPick()

    // Then fire again after 10 seconds to handle consecutive turns (snake draft)
    const followupAutopickTimeout = setTimeout(() => {
      attemptAutoPick()
    }, 10000)

    return () => clearTimeout(followupAutopickTimeout)
  }, [isMyTurn, autopickEnabled, hasTriggered, draftId])

  useEffect(() => {
    // Removed development mode check - autopick should work in all environments

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
