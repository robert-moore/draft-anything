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
  maxEmojis,
  pickNumber,
  pickerName,
  pickContent
}: {
  reactions: Reaction[]
  currentUserId: string
  onReact: (emoji: string, isActive: boolean) => void
  canReact: boolean
  currentUserReactions: string[]
  userIdToName: Record<string, string>
  inline?: boolean
  maxEmojis?: number
  pickNumber?: number
  pickerName?: string
  pickContent?: string
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

  const [showMobileTooltip, setShowMobileTooltip] = useState(false)
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)

  // Detect mobile
  const isMobile =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

  function handleTouchStart() {
    if (!isMobile) return
    longPressTimeout.current = setTimeout(() => setShowMobileTooltip(true), 400)
  }

  function handleTouchEnd() {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current)
  }

  // Handle click outside to dismiss the floating tooltip
  useEffect(() => {
    if (!showMobileTooltip) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.emoji-reactions-container')) {
        setShowMobileTooltip(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMobileTooltip])

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

  if (Object.keys(grouped).length === 0) {
    return (
      <div
        className={`flex flex-wrap gap-1 items-center pt-1${
          inline ? ' mr-2' : ''
        }`}
        style={{ position: 'relative' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`emoji-reactions-container flex flex-wrap gap-1 items-center pt-1${
                inline ? ' mr-2' : ''
              }`}
              style={{
                position: 'relative',
                ...(showMobileTooltip
                  ? { pointerEvents: 'none', zIndex: 0 }
                  : {})
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
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
                const users = grouped[emoji] || []
                const isActive = users.some(
                  (u: Reaction) => u.userId === currentUserId
                )
                return (
                  <button
                    key={emoji}
                    className={`flex items-center py-0.5 rounded-full text-sm transition-colors
                      ${
                        isActive
                          ? 'bg-primary/10 ring-1 ring-primary/30 px-2'
                          : 'hover:bg-accent px-1'
                      }
                      ${!canReact ? 'cursor-default' : ''}
                    `}
                    style={{ border: 'none', background: 'none' }}
                    onClick={() => {
                      // On mobile, show tooltip instead of toggling reaction
                      if (isMobile && canReact) {
                        setShowMobileTooltip(true)
                        return
                      }
                      // On desktop, toggle reaction as before
                      if (canReact) {
                        onReact(emoji, isActive && emoji ? true : false)
                      }
                    }}
                    type="button"
                    disabled={!canReact}
                  >
                    <span
                      style={{
                        fontSize: '1em',
                        lineHeight: 1,
                        marginRight: '0.3rem'
                      }}
                      className={popCounts[emoji] ? 'bounce-emoji' : ''}
                    >
                      {emoji}
                    </span>
                    <span className="text-xs font-semibold">
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
                  grouped[e].some((u: Reaction) => u.userId === currentUserId)
                )
                const rest = allEmojis.filter(e => e !== myEmoji)
                const ordered = myEmoji ? [myEmoji, ...rest] : rest
                return ordered.map(emoji => {
                  const users = grouped[emoji] || []
                  if (!users.length) return null
                  return (
                    <div key={emoji} className="mb-1">
                      <span className="mr-1">{emoji}</span>
                      <span>
                        {users
                          .map(
                            (u: Reaction) => userIdToName[u.userId] || 'Unknown'
                          )
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

      {/* Floating tooltip div - positioned above emoji row */}
      {showMobileTooltip && (
        <div
          className="absolute z-[9999] bg-card p-3 rounded-lg shadow-lg border border-border max-w-sm w-full max-h-[60vh] overflow-y-auto"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-xs mt-2">
            {(() => {
              const allEmojis = Object.keys(grouped)
              const myEmoji = allEmojis.find(e =>
                grouped[e].some((u: Reaction) => u.userId === currentUserId)
              )
              const rest = allEmojis.filter(e => e !== myEmoji)
              const ordered = myEmoji ? [myEmoji, ...rest] : rest
              return ordered.map(emoji => {
                const users = grouped[emoji] || []
                if (!users.length) return null
                return (
                  <div key={emoji} className="flex items-start mb-3">
                    <span
                      className="mr-2 text-xs"
                      style={{ fontSize: '0.75rem', lineHeight: '1.2' }}
                    >
                      {emoji}
                    </span>
                    <span className="flex-1 text-xs text-foreground">
                      {users
                        .map(
                          (u: Reaction) => userIdToName[u.userId] || 'Unknown'
                        )
                        .join(', ')}
                    </span>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}
    </>
  )
}
