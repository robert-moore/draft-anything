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
        <span className="font-bold text-black dark:text-white">PLAYERS</span>
        <span className="font-mono text-black dark:text-white">{players.current}/{players.max}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-black dark:text-white">TIMER</span>
        <span className="font-mono text-black dark:text-white">{timer}s</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-black dark:text-white">ROUND</span>
        <span className="font-mono text-black dark:text-white">{round.current}/{round.total}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-black dark:text-white">PICK</span>
        <span className="font-mono text-black dark:text-white">{pick.current}/{pick.perRound}</span>
      </div>
    </div>
  )
}