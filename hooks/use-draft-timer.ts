import { useEffect, useState } from 'react'

interface UseDraftTimerProps {
  turnStartedAt: string | null
  secondsPerRound: number
  isPaused?: boolean
}

export function useDraftTimer({
  turnStartedAt,
  secondsPerRound,
  isPaused = false
}: UseDraftTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const isUntimed = secondsPerRound === 0

  useEffect(() => {
    if (!turnStartedAt || isPaused) {
      return
    }

    const calculateTime = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(turnStartedAt).getTime()) / 1000
      )

      if (isUntimed) {
        // Count up for untimed drafts
        return elapsed
      } else {
        // Count down for timed drafts
        return Math.max(0, secondsPerRound - elapsed)
      }
    }

    // Set initial value
    setSeconds(calculateTime())

    // Update every 100ms
    const interval = setInterval(() => {
      const time = calculateTime()
      setSeconds(time)

      // Don't clear interval for timed drafts - let it continue to track expiration
    }, 100)

    return () => clearInterval(interval)
  }, [turnStartedAt, secondsPerRound, isPaused, isUntimed])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate color based on time remaining (only for timed drafts)
  const getColor = () => {
    if (isUntimed) return 'default'
    if (seconds <= 10) return 'red'
    if (seconds <= 30) return 'yellow'
    return 'green'
  }

  return {
    secondsLeft: isUntimed ? -1 : seconds, // -1 indicates counting up
    secondsElapsed: isUntimed ? seconds : secondsPerRound - seconds,
    formatted: formatTime(seconds),
    percentage: isUntimed ? 100 : (seconds / secondsPerRound) * 100,
    color: getColor(),
    isExpired: !isUntimed && seconds === 0,
    isUntimed
  }
}
