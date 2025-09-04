'use client'

import { createGuestFetch } from '@/lib/guest-utils'
import { useCallback, useEffect, useState } from 'react'
import { BrutalButton } from '../ui/brutal-button'

interface QueueItem {
  id: string
  payload?: string
  curatedOptionId?: number
  position: number
  curatedOptionText?: string
}

interface AutopickSuggestionsProps {
  draftId: string
  isMyTurn: boolean
  isFreeform: boolean
  curatedOptions: Array<{ id: number; optionText: string }>
  onSuggestionSelect: (suggestion: string) => void
  currentPick: string
}

export function AutopickSuggestions({
  draftId,
  isMyTurn,
  isFreeform,
  curatedOptions,
  onSuggestionSelect,
  currentPick
}: AutopickSuggestionsProps) {
  const [autopickEnabled, setAutopickEnabled] = useState<boolean | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadAutopickSettings = useCallback(async () => {
    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/autopick-settings`)
      if (response.ok) {
        const data = await response.json()
        setAutopickEnabled(data.enabled)
      } else {
        console.error('Failed to load autopick settings')
      }
    } catch (error) {
      console.error('Error loading autopick settings:', error)
    }
  }, [draftId])

  const loadQueue = useCallback(async () => {
    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/autopick-queue`)
      if (response.ok) {
        const data = await response.json()
        const enrichedQueue = data.queue.map((item: QueueItem) => ({
          ...item,
          curatedOptionText: item.curatedOptionId
            ? curatedOptions.find(opt => opt.id === item.curatedOptionId)?.optionText
            : undefined
        }))
        setQueue(enrichedQueue)
      } else {
        console.error('Failed to load autopick queue')
        setQueue([])
      }
    } catch (error) {
      console.error('Error loading autopick queue:', error)
      setQueue([])
    }
  }, [draftId, curatedOptions])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([loadAutopickSettings(), loadQueue()])
    setIsLoading(false)
  }, [loadAutopickSettings, loadQueue])

  useEffect(() => {
    if (isMyTurn) {
      loadData()
    }
  }, [isMyTurn, loadData])

  if (!isMyTurn || isLoading || autopickEnabled || queue.length === 0 || currentPick.trim().length > 0) {
    return null
  }

  const handleSuggestionClick = (item: QueueItem) => {
    const suggestion = isFreeform 
      ? item.payload || '' 
      : item.curatedOptionText || ''
    
    onSuggestionSelect(suggestion)
  }

  return (
    <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Suggestions from your queue
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {queue.slice(0, 3).map((item, index) => {
          const displayText = isFreeform 
            ? item.payload 
            : item.curatedOptionText
          
          if (!displayText) return null
          
          return (
            <BrutalButton
              key={item.id}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(item)}
              className="text-xs px-2 py-1 h-auto bg-background/80 hover:bg-accent/80 border-border/60 max-w-[200px] truncate"
            >
              {index === 0 && <span className="mr-1 text-primary">⭐</span>}
              {displayText.length > 30 ? displayText.substring(0, 30) + '...' : displayText}
            </BrutalButton>
          )
        })}
      </div>
      
      {queue.length > 3 && (
        <div className="mt-2 text-xs text-muted-foreground">
          +{queue.length - 3} more in your queue
        </div>
      )}
    </div>
  )
}