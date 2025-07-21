import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEffect, useRef, useState } from 'react'
import { EmojiReactPopover } from './emoji-react-popover'

interface Reaction {
  emoji: string
  userId: string
}

export function EmojiReactionsRow({
  reactions,
  currentUserId,
  onReact,
  canReact,
  currentUserReactions,
  userIdToName,
  inline = false,
  maxEmojis
}: {
  reactions: Reaction[]
  currentUserId: string
  onReact: (emoji: string, isActive: boolean) => void
  canReact: boolean
  currentUserReactions: string[]
  userIdToName: Record<string, string>
  inline?: boolean
  maxEmojis?: number
}) {
  // Group reactions by emoji, filtering out null/empty
  const grouped = reactions
    .filter(r => r.emoji)
    .reduce<Record<string, Reaction[]>>((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = []
      acc[r.emoji].push(r)
      return acc
    }, {})
  // Sort emojis by frequency, then alphabetically
  let emojis = Object.keys(grouped).sort((a, b) => {
    const diff = grouped[b].length - grouped[a].length
    if (diff !== 0) return diff
    return a.localeCompare(b)
  })
  // Always show the user's emoji on the right if present
  const myEmoji = emojis.find(e =>
    grouped[e].some(u => u.userId === currentUserId)
  )
  emojis = emojis.filter(e => e !== myEmoji)
  // Limit the number of emojis shown
  const limit = typeof maxEmojis === 'number' ? maxEmojis : inline ? 3 : 5
  let shown = emojis.slice(0, limit - (myEmoji ? 1 : 0))
  let hasMore = emojis.length + (myEmoji ? 1 : 0) > limit
  if (myEmoji) shown.push(myEmoji)
  // If there are more, show ... on the left
  if (hasMore) shown = ['...', ...shown.slice(-(limit - 1))]
  if (Object.keys(grouped).length === 0) {
    return (
      <div
        className={`flex flex-wrap gap-1 items-center pt-1${
          inline ? ' mr-2' : ''
        }`}
        style={{ position: 'relative' }}
      >
        {canReact && (
          <div className="pt-1">
            <EmojiReactPopover
              onReact={onReact}
              currentUserReactions={currentUserReactions}
            />
          </div>
        )}
      </div>
    )
  }
  // Track previous counts for pop animation
  const [popCounts, setPopCounts] = useState<Record<string, boolean>>({})
  const prevCountsRef = useRef<Record<string, number>>({})
  useEffect(() => {
    const newPop: Record<string, boolean> = {}
    for (const emoji of Object.keys(grouped)) {
      const prev = prevCountsRef.current[emoji] || 0
      const curr = grouped[emoji].length
      if (curr > prev) {
        newPop[emoji] = true
        setTimeout(() => {
          setPopCounts(pc => ({ ...pc, [emoji]: false }))
        }, 300)
      }
    }
    setPopCounts(pc => ({ ...pc, ...newPop }))
    prevCountsRef.current = Object.fromEntries(
      Object.keys(grouped).map(e => [e, grouped[e].length])
    )
  }, [reactions])
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex flex-wrap gap-1 items-center pt-1${
              inline ? ' mr-2' : ''
            }`}
            style={{ position: 'relative' }}
          >
            {shown.map(emoji => {
              if (emoji === '...') {
                return (
                  <span
                    key="more"
                    className="px-1 text-xs text-muted-foreground"
                  >
                    ...
                  </span>
                )
              }
              const users = grouped[emoji]
              const isActive = users.some(u => u.userId === currentUserId)
              return (
                <button
                  key={emoji}
                  className={`flex items-center py-0.5 rounded-full text-sm transition-colors
                    ${
                      isActive
                        ? 'bg-primary/10 ring-1 ring-primary/30 px-2'
                        : 'hover:bg-accent px-1'
                    }
                  `}
                  style={{ border: 'none', background: 'none' }}
                  onClick={() =>
                    onReact(emoji, isActive && emoji ? true : false)
                  }
                  type="button"
                >
                  <span
                    style={{ fontSize: '1em', lineHeight: 1 }}
                    className={popCounts[emoji] ? 'bounce-emoji' : ''}
                  >
                    {emoji}
                  </span>
                  <span className="ml-1 text-xs font-semibold">
                    <span className={popCounts[emoji] ? 'pop-count' : ''}>
                      {users.length}
                    </span>
                  </span>
                </button>
              )
            })}
            {canReact && (
              <div className="pt-1">
                <EmojiReactPopover
                  onReact={onReact}
                  currentUserReactions={currentUserReactions}
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs mt-2">
            {(() => {
              // Put the current user's emoji first if present
              const allEmojis = Object.keys(grouped)
              const myEmoji = allEmojis.find(e =>
                grouped[e].some(u => u.userId === currentUserId)
              )
              const rest = allEmojis.filter(e => e !== myEmoji)
              const ordered = myEmoji ? [myEmoji, ...rest] : rest
              return ordered.map(emoji => {
                const users = grouped[emoji]
                if (!users.length) return null
                return (
                  <div key={emoji} className="mb-1">
                    <span className="mr-1">{emoji}</span>
                    <span>
                      {users
                        .map(u => userIdToName[u.userId] || 'Unknown')
                        .join(', ')}
                    </span>
                  </div>
                )
              })
            })()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
