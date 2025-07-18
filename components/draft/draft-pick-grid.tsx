import { DraftPick } from '@/types/draft'

interface DraftPickGridProps {
  pickNumber: number
  pick?: DraftPick
}

export function DraftPickGrid({ pickNumber, pick }: DraftPickGridProps) {
  return (
    <div 
      className={`border-2 border-border p-3 h-20 ${
        pick ? 'bg-card' : 'bg-muted border-dashed'
      }`}
    >
      {pick ? (
        <>
          <div className="font-bold text-xs mb-1 text-foreground">#{pick.pickNumber}</div>
          <div className="text-sm font-medium truncate text-foreground">{pick.payload}</div>
          <div className="text-xs text-muted-foreground truncate">{pick.clientName}</div>
        </>
      ) : (
        <div className="text-muted-foreground text-xs">#{pickNumber}</div>
      )}
    </div>
  )
}