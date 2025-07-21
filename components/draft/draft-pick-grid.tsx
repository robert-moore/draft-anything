import { DraftPick } from '@/types/draft'

interface DraftPickGridProps {
  pickNumber: number
  pick?: DraftPick
  currentUserId?: string
}

// Utility to truncate pick payload
function truncatePickPayload(payload: string, maxLength = 150) {
  if (payload.length > maxLength) {
    return payload.slice(0, maxLength) + '...'
  }
  return payload
}

export function DraftPickGrid({
  pickNumber,
  pick,
  currentUserId
}: DraftPickGridProps) {
  const isMyPick = pick && currentUserId && pick.clientId === currentUserId

  return (
    <div
      className={`relative border-2 p-3 h-20 ${
        pick
          ? isMyPick
            ? 'bg-primary/20 border-border'
            : 'bg-card border-border'
          : 'bg-muted border-dashed border-border'
      }`}
    >
      {pick ? (
        <>
          <div className="font-bold text-xs mb-1 text-foreground">
            #{pick.pickNumber}
          </div>
          <div className="text-sm font-medium truncate text-foreground">
            {truncatePickPayload(pick.payload)}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {pick.clientName}
          </div>
        </>
      ) : (
        <div className="text-muted-foreground text-xs">#{pickNumber}</div>
      )}
    </div>
  )
}
