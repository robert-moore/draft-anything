'use client'

import { BrutalButton } from '@/components/ui/brutal-button'
import { NumberInput } from '@/components/ui/number-input'
import {
  MAX_EXTRA_ROUNDS,
  extraPicksNeeded,
  isWithinExtendWindow,
  maxExtraRoundsAllowed
} from '@/lib/draft-extend'
import { createGuestFetch } from '@/lib/guest-utils'
import { useState } from 'react'

interface ExtendDraftControlsProps {
  draftGuid: string
  numRounds: number
  isFreeform: boolean
  participantCount: number
  lastPickCreatedAt: string | null
  unusedOptionCount: number
  onExtended: () => void
}

export function ExtendDraftControls({
  draftGuid,
  numRounds,
  isFreeform,
  participantCount,
  lastPickCreatedAt,
  unusedOptionCount,
  onExtended
}: ExtendDraftControlsProps) {
  const [extraRounds, setExtraRounds] = useState<number | null>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxAllowed = maxExtraRoundsAllowed({
    currentNumRounds: numRounds,
    participantCount,
    isFreeform,
    unusedOptionCount
  })

  const needed =
    extraRounds && extraRounds > 0
      ? extraPicksNeeded(extraRounds, participantCount)
      : 0

  if (!isWithinExtendWindow(lastPickCreatedAt)) {
    return null
  }

  const canSubmit =
    extraRounds !== null &&
    extraRounds >= 1 &&
    extraRounds <= MAX_EXTRA_ROUNDS &&
    extraRounds <= maxAllowed &&
    !isSubmitting

  const handleExtend = async () => {
    if (!canSubmit || extraRounds === null) return

    setIsSubmitting(true)
    setError(null)

    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftGuid}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraRounds })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extend draft')
      }

      onExtended()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8 pt-8 border-t-2 border-border text-left space-y-6">
      <div className="text-center space-y-1">
        <p className="font-bold text-foreground">Keep it going</p>
        <p className="text-sm text-muted-foreground">
          Add more rounds and the snake continues. You have 24 hours after the
          last pick.
        </p>
      </div>

      <NumberInput
        id="extraRounds"
        label="Extra rounds"
        value={extraRounds}
        onChange={setExtraRounds}
        min={1}
        max={MAX_EXTRA_ROUNDS}
        required={true}
      />

      {!isFreeform && (
        <p className="text-sm text-muted-foreground">
          {unusedOptionCount} unused option
          {unusedOptionCount === 1 ? '' : 's'} left
          {participantCount > 0
            ? ` · each extra round needs ${participantCount}`
            : ''}
          {extraRounds !== null && extraRounds > 0 && unusedOptionCount < needed
            ? ` · not enough for ${extraRounds} extra round${
                extraRounds === 1 ? '' : 's'
              }`
            : ''}
        </p>
      )}

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}

      <BrutalButton
        onClick={handleExtend}
        variant="filled"
        className="w-full"
        size="lg"
        disabled={!canSubmit}
      >
        {isSubmitting
          ? 'Extending...'
          : extraRounds
            ? `Extend by ${extraRounds} round${extraRounds === 1 ? '' : 's'}`
            : 'Extend draft'}
      </BrutalButton>
    </div>
  )
}
