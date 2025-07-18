interface DraftMetadataProps {
  players: { current: number; max: number }
  timer: number
  round: { current: number; total: number }
  pick: { current: number; perRound: number }
}

export function DraftMetadata({ players, timer, round, pick }: DraftMetadataProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-bold text-foreground">PLAYERS</span>
        <span className="font-mono text-foreground">{players.current}/{players.max}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-foreground">TIMER</span>
        <span className="font-mono text-foreground">{timer === 0 ? 'UNTIMED' : `${timer}s`}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-foreground">ROUND</span>
        <span className="font-mono text-foreground">{round.current}/{round.total}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-foreground">PICK</span>
        <span className="font-mono text-foreground">{pick.current}/{pick.perRound}</span>
      </div>
    </div>
  )
}