'use client'

import { RadioGroupSegmented, RadioGroupSegmentedItem } from '@/components/ui/radio-group-segmented'

type ViewMode = 'selections' | 'by-round' | 'by-drafter'

interface ViewModeTabsProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeTabs({ viewMode, onChange }: ViewModeTabsProps) {
  return (
    <RadioGroupSegmented 
      value={viewMode} 
      onValueChange={(value) => onChange(value as ViewMode)}
      className="text-xs"
    >
      <RadioGroupSegmentedItem value="selections" className="px-3 py-1">
        Selections
      </RadioGroupSegmentedItem>
      <RadioGroupSegmentedItem value="by-round" className="px-3 py-1">
        By Round
      </RadioGroupSegmentedItem>
      <RadioGroupSegmentedItem value="by-drafter" className="px-3 py-1">
        By Drafter
      </RadioGroupSegmentedItem>
    </RadioGroupSegmented>
  )
}