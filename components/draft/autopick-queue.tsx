'use client'

import { createGuestFetch } from '@/lib/guest-utils'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'
import { BrutalInput } from '../ui/brutal-input'
import { CuratedOptionsDropdown } from '../ui/curated-options-dropdown'

interface AutopickQueueItem {
  id: string
  payload?: string
  curatedOptionId?: number
  isUsed?: boolean
}

interface AutopickQueueProps {
  draftId: string
  isFreeform: boolean
  curatedOptions: Array<{ id: number; optionText: string; isUsed: boolean }>
  className?: string
  onQueueChange?: (queue: AutopickQueueItem[]) => void
  isMyTurn?: boolean
  onPickSubmit?: (text: string, curatedOptionId?: number) => Promise<void>
  recentPicks?: Array<{ payload: string }> // Recent picks to auto-remove from queue
}

export const AutopickQueue = memo(function AutopickQueue({
  draftId,
  isFreeform,
  curatedOptions = [],
  className,
  onQueueChange,
  isMyTurn = false,
  onPickSubmit,
  recentPicks = []
}: AutopickQueueProps) {
  const [queue, setQueue] = useState<AutopickQueueItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [selectedCuratedOptionText, setSelectedCuratedOptionText] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Normalize text for comparison (remove whitespace, lowercase)
  const normalizeText = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '').trim()
  }

  // Remove items from queue that match any of the recent picks
  const cleanQueueBasedOnPicks = useCallback(() => {
    if (!recentPicks.length) return
    
    const normalizedPicks = recentPicks.map(pick => normalizeText(pick.payload))
    
    setQueue(prev => {
      const filtered = prev.filter(item => {
        const itemText = getDisplayText(item)
        const normalizedItem = normalizeText(itemText)
        return !normalizedPicks.includes(normalizedItem)
      })
      
      // Only update if items were actually removed
      if (filtered.length !== prev.length) {
        // Schedule the parent notification after render
        setTimeout(() => onQueueChange?.(filtered), 0)
        return filtered
      }
      return prev
    })
  }, [recentPicks, onQueueChange])

  // Auto-clean queue when picks change
  useEffect(() => {
    cleanQueueBasedOnPicks()
  }, [cleanQueueBasedOnPicks])

  // dnd-kit sensors with better focus isolation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Higher threshold to avoid conflicts with clicks
      }
    })
  )

  const availableCuratedOptions = curatedOptions.filter(
    option =>
      !option.isUsed &&
      !queue.some(queueItem => queueItem.curatedOptionId === option.id)
  )

  const loadQueue = useCallback(async () => {
    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/autopick-queue`)
      if (response.ok) {
        const data = await response.json()
        setQueue(data.queue)
      }
    } catch (error) {
      console.error('Error loading queue:', error)
    }
  }, [draftId])

  // Load queue once on mount - optimistic updates handle everything else
  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  // Helper to update queue and notify parent
  const updateQueue = (newQueue: AutopickQueueItem[]) => {
    setQueue(newQueue)
    onQueueChange?.(newQueue)
  }

  const addToQueue = (optionText?: string) => {
    const text = isFreeform
      ? newItemText.trim()
      : (optionText || selectedCuratedOptionText).trim()
    if (!text) return

    // Create new item optimistically
    const newItem: AutopickQueueItem = {
      id: crypto.randomUUID(),
      payload: isFreeform ? text : undefined,
      curatedOptionId: isFreeform
        ? undefined
        : curatedOptions.find(opt => opt.optionText === text)?.id,
      isUsed: false
    }

    // Validate curated option exists
    if (!isFreeform && !newItem.curatedOptionId) {
      setError('Selected option not found')
      return
    }

    // Check for duplicates in curated drafts
    if (
      !isFreeform &&
      queue.some(
        item => item.curatedOptionId === newItem.curatedOptionId && !item.isUsed
      )
    ) {
      setError('This option is already in your queue')
      return
    }

    // Optimistic update - instant UI response
    updateQueue([...queue, newItem])
    setNewItemText('')
    setSelectedCuratedOptionText('')
    setError(null)
  }

  const removeFromQueue = (itemId: string) => {
    updateQueue(queue.filter(item => item.id !== itemId))
  }

  // dnd-kit drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex(item => item.id === active.id)
      const newIndex = queue.findIndex(item => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newQueue = arrayMove(queue, oldIndex, newIndex)
        updateQueue(newQueue)
      }
    }
  }

  const getDisplayText = (item: AutopickQueueItem) => {
    if (item.payload) return item.payload
    if (item.curatedOptionId) {
      return (
        curatedOptions.find(opt => opt.id === item.curatedOptionId)
          ?.optionText || 'Unknown option'
      )
    }
    return 'Unknown item'
  }

  // Handle clicking plus icon to enter selection mode
  const handleStartSelection = (item: AutopickQueueItem) => {
    if (!isMyTurn || item.isUsed || isSubmitting) return
    setPendingSelectionId(item.id)
  }

  // Handle confirming the selection
  const handleConfirmSelection = async (item: AutopickQueueItem) => {
    if (!onPickSubmit || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const text = getDisplayText(item)
      await onPickSubmit(text, item.curatedOptionId)

      // Success - immediately remove this item from queue since we know it was drafted
      setQueue(prev => {
        const filtered = prev.filter(queueItem => queueItem.id !== item.id)
        // Schedule the parent notification after render
        setTimeout(() => onQueueChange?.(filtered), 0)
        return filtered
      })
      
      // Clear pending selection
      setPendingSelectionId(null)
    } catch (error) {
      console.error('Pick submission failed:', error)
      setError('Failed to submit pick. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle canceling selection
  const handleCancelSelection = () => {
    setPendingSelectionId(null)
  }

  // Sortable item component with focus isolation
  function SortableQueueItem({
    item,
    position
  }: {
    item: AutopickQueueItem
    position: number
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({
      id: item.id,
      disabled: item.isUsed
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    }

    const isSelectable = isMyTurn && !item.isUsed && onPickSubmit
    const isPending = pendingSelectionId === item.id

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...(!item.isUsed && !isPending ? listeners : {})}
        tabIndex={undefined} // Explicitly remove tabIndex to prevent focus issues
        role={undefined} // Remove role to prevent accessibility conflicts
        className={cn(
          'group relative border-2 rounded-lg transition-all duration-300',
          'flex items-center gap-3 p-3',
          'select-none touch-none',
          isDragging && 'opacity-60 scale-102 z-50 shadow-lg rotate-1',
          isPending && [
            'bg-green-50 border-green-200 shadow-md shadow-green-100 scale-[1.02]'
          ],
          !isPending &&
            !item.isUsed && [
              'bg-card border-border',
              'hover:border-primary/30 hover:shadow-sm hover:bg-accent/20'
            ],
          !isPending && item.isUsed && ['opacity-50 bg-muted border-border/50']
        )}
      >
        {/* Circle with number or plus - transforms on hover when selectable */}
        <button
          onClick={e => {
            e.stopPropagation()
            if (isPending) return
            if (isSelectable) handleStartSelection(item)
          }}
          disabled={!isSelectable || isPending}
          className={cn(
            'relative flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
            isPending &&
              'bg-green-500/20 text-green-600 border border-green-500/40',
            !isPending &&
              !isSelectable &&
              'bg-primary/15 text-primary cursor-default',
            !isPending &&
              isSelectable && [
                'bg-primary/20 text-primary border border-primary/30',
                'hover:bg-primary/30 hover:scale-110 cursor-pointer'
              ]
          )}
        >
          {isPending ? (
            <Check className="w-3.5 h-3.5" />
          ) : isSelectable ? (
            <>
              {/* Number - fades out on hover */}
              <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                {position}
              </span>
              {/* Plus - fades in on hover */}
              <Plus className="absolute inset-0 w-3.5 h-3.5 m-auto opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110" />
            </>
          ) : (
            position
          )}
        </button>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'text-sm font-medium transition-colors',
              isPending && 'text-green-700',
              !isPending && item.isUsed && 'line-through text-muted-foreground',
              !isPending && !item.isUsed && 'text-foreground'
            )}
          >
            {getDisplayText(item)}
            {!isPending && item.isUsed && (
              <span className="text-xs text-muted-foreground ml-2 font-normal">
                Used
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isPending ? (
            // Confirm state actions
            <>
              <button
                onClick={() => handleConfirmSelection(item)}
                disabled={isSubmitting}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  'bg-green-600 text-white hover:bg-green-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSubmitting ? '...' : 'Draft'}
              </button>
              <button
                onClick={handleCancelSelection}
                disabled={isSubmitting}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            // Normal state actions
            <>
              {/* Drag handle */}
              {!item.isUsed && (
                <div
                  {...listeners}
                  className={cn(
                    'p-1 cursor-grab active:cursor-grabbing transition-opacity',
                    'opacity-40 group-hover:opacity-70'
                  )}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
              )}

              {/* Delete button */}
              {!item.isUsed && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    removeFromQueue(item.id)
                  }}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-40 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  const availableSlots = queue.filter(item => !item.isUsed).length

  return (
    <div className={cn('w-full', className)}>
      {error && (
        <div className="bg-destructive text-destructive-foreground px-3 py-2 text-sm mb-4 border-l-4 border-destructive">
          {error}
          <button onClick={() => setError(null)} className="float-right mt-0.5">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="space-y-1">
        {queue.length === 0 ? (
          <div
            onClick={() => setIsAddingItem(true)}
            className="text-center py-6 border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="text-muted-foreground text-sm">
              Click to add items
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={queue.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {queue.map((item, index) => (
                <SortableQueueItem
                  key={item.id}
                  item={item}
                  position={index + 1}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeId ? (
                <div className="opacity-90 rotate-2 scale-105">
                  {(() => {
                    const draggedItem = queue.find(
                      item => item.id === activeId
                    )!
                    const draggedIndex = queue.findIndex(
                      item => item.id === activeId
                    )
                    return (
                      <SortableQueueItem
                        item={draggedItem}
                        position={draggedIndex + 1}
                      />
                    )
                  })()}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {(queue.length > 0 || isAddingItem) && (
          <div>
            {!isAddingItem ? (
              <button
                onClick={() => setIsAddingItem(true)}
                className="w-full text-left text-muted-foreground text-sm py-2 px-3 hover:bg-muted/30 transition-colors flex items-center gap-2 rounded"
              >
                <Plus className="w-4 h-4" />
                Add item
              </button>
            ) : (
              <div className="bg-card border border-border rounded p-2">
                {isFreeform ? (
                  <BrutalInput
                    placeholder="Add item..."
                    value={newItemText}
                    onChange={e => setNewItemText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        addToQueue()
                      } else if (e.key === 'Escape') {
                        setIsAddingItem(false)
                        setNewItemText('')
                        setSelectedCuratedOptionText('')
                      }
                    }}
                    autoFocus
                    className="w-full border-0 bg-transparent focus:ring-0 p-0 text-sm"
                  />
                ) : (
                  <CuratedOptionsDropdown
                    options={availableCuratedOptions}
                    value={selectedCuratedOptionText}
                    onValueChange={value => {
                      setSelectedCuratedOptionText(value)
                      if (value) {
                        addToQueue(value)
                      }
                    }}
                    placeholder="Choose option..."
                    disabled={availableCuratedOptions.length === 0}
                  />
                )}

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => {
                      setIsAddingItem(false)
                      setNewItemText('')
                      setSelectedCuratedOptionText('')
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>{availableSlots} ready</span>
        {queue.length > 1 && <span>Drag to reorder</span>}
      </div>
    </div>
  )
})
