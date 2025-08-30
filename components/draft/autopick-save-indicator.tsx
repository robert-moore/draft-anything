'use client'

import { cn } from '@/lib/utils'
import { memo } from 'react'

interface AutopickSaveIndicatorProps {
  saveState: 'saved' | 'dirty' | 'saving'
}

export const AutopickSaveIndicator = memo(function AutopickSaveIndicator({ saveState }: AutopickSaveIndicatorProps) {
  if (saveState === 'saved') {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className={cn(
        "w-2 h-2 rounded-full",
        saveState === 'saving' && "bg-yellow-500 animate-pulse",
        saveState === 'dirty' && "bg-blue-500 animate-pulse"
      )} />
      {saveState === 'saving' && 'Saving...'}
      {saveState === 'dirty' && 'Unsaved'}
    </div>
  )
})