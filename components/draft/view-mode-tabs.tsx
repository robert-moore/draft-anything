'use client'

type ViewMode = 'selections' | 'by-round' | 'by-drafter'

interface ViewModeTabsProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

const VIEW_MODES = [
  { key: 'selections' as const, label: 'Selections' },
  { key: 'by-round' as const, label: 'By Round' },
  { key: 'by-drafter' as const, label: 'By Drafter' }
]

export function ViewModeTabs({ viewMode, onChange }: ViewModeTabsProps) {
  return (
    <div className="flex border-2 border-black dark:border-white">
      {VIEW_MODES.map(({ key, label }, index) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            index > 0 ? 'border-l-2 border-black dark:border-white' : ''
          } ${
            viewMode === key 
              ? 'bg-black dark:bg-white text-white dark:text-black' 
              : 'bg-white dark:bg-black text-black dark:text-white hover:bg-muted dark:hover:bg-muted/20'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}