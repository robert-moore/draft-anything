'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { BrutalSection } from '../ui/brutal-section'
import { AutopickQueue } from './autopick-queue'
import { AutopickSaveIndicator } from './autopick-save-indicator'
import { AutopickToggle } from './autopick-toggle'

interface AutopickSectionProps {
  draftId: string
  isFreeform: boolean
  curatedOptions: Array<{ id: number; optionText: string; isUsed: boolean }>
}

function createGuestFetch() {
  return async (url: string, options: RequestInit = {}) => {
    const GUEST_CLIENT_ID_KEY = 'draft-guest-client-id'
    let clientId = localStorage.getItem(GUEST_CLIENT_ID_KEY)
    if (!clientId) {
      clientId = crypto.randomUUID()
      localStorage.setItem(GUEST_CLIENT_ID_KEY, clientId)
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(clientId ? { 'x-client-id': clientId } : {})
      }
    })
  }
}

export const AutopickSection = memo(function AutopickSection({
  draftId,
  isFreeform,
  curatedOptions
}: AutopickSectionProps) {
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'saving'>(
    'saved'
  )
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleQueueChange = useCallback(
    async (newQueue: any[]) => {
      setSaveState('dirty')

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Schedule save
      saveTimeoutRef.current = setTimeout(async () => {
        setSaveState('saving')

        try {
          const guestFetch = createGuestFetch()
          const response = await guestFetch(
            `/api/drafts/${draftId}/autopick-queue`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ queue: newQueue })
            }
          )

          if (!response.ok) {
            throw new Error('Failed to save queue')
          }

          setSaveState('saved')
        } catch (error) {
          console.error('Autopick queue save failed:', error)
          setSaveState('dirty')
        }
      }, 1000)
    },
    [draftId]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <BrutalSection
      title="Autopick"
      contentClassName="p-4"
      headerActions={<AutopickSaveIndicator saveState={saveState} />}
    >
      <div className="mb-4">
        <AutopickToggle draftId={draftId} />
      </div>

      <AutopickQueue
        draftId={draftId}
        isFreeform={isFreeform}
        curatedOptions={curatedOptions}
        onQueueChange={handleQueueChange}
      />
    </BrutalSection>
  )
})
