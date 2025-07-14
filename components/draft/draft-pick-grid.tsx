import { DraftPick } from '@/types/draft'

interface DraftPickGridProps {
  pickNumber: number
  pick?: DraftPick
}

export function DraftPickGrid({ pickNumber, pick }: DraftPickGridProps) {
  return (
    <div 
      className={`border-2 border-black dark:border-white p-3 h-20 ${
        pick ? 'bg-white dark:bg-black' : 'bg-muted dark:bg-muted/20 border-dashed'
      }`}
    >
      {pick ? (
        <>
          <div className="font-bold text-xs mb-1 text-black dark:text-white">#{pick.pickNumber}</div>
          <div className="text-sm font-medium truncate text-black dark:text-white">{pick.payload}</div>
          <div className="text-xs text-muted-foreground truncate">{pick.clientName}</div>
        </>
      ) : (
        <div className="text-muted-foreground text-xs">#{pickNumber}</div>
      )}
    </div>
  )
}