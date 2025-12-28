'use client'

import { parseTimestamp } from '@/lib/utils/timestamp'
import { DraftPick } from '@/types/draft'
import { ArrowDown, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import ChatBubble from './chat-bubble'
import PickMessage from './pick-message'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface ChatMessage {
  id: number
  messageContent: string
  userId: string
  createdAt?: string
}

type ChatItem =
  | { type: 'message'; data: ChatMessage }
  | { type: 'pick'; data: DraftPick }

export default function ChatComponent({
  draftId,
  currentUser,
  messages,
  picks,
  userIdToName,
  onSendMessage,
  isJoined = false
}: {
  draftId: string
  currentUser: string | null
  messages: ChatMessage[]
  picks?: DraftPick[]
  userIdToName: Record<string, string>
  onSendMessage: (messageContent: string) => Promise<void>
  isJoined?: boolean
}) {
  const [newMessage, setNewMessage] = useState('')
  const [showTopGradient, setShowTopGradient] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isUserScrolledUpRef = useRef(false)
  const previousMessageCountRef = useRef(0)

  // Merge and sort messages and picks by timestamp
  const mergedItems = useMemo(() => {
    const items: ChatItem[] = []

    // Add messages
    messages.forEach(message => {
      items.push({ type: 'message', data: message })
    })

    // Add picks
    if (picks) {
      picks.forEach(pick => {
        items.push({ type: 'pick', data: pick })
      })
    }

    // Sort by createdAt timestamp, with secondary sort for stability
    items.sort((a, b) => {
      const aTime = parseTimestamp(a.data.createdAt)
      const bTime = parseTimestamp(b.data.createdAt)

      // Primary sort: by timestamp (ascending - older first)
      if (aTime !== bTime) {
        return aTime - bTime
      }

      // Secondary sort: if same timestamp, picks before messages (picks happen first)
      if (a.type !== b.type) {
        return a.type === 'pick' ? -1 : 1
      }

      // Same type, sort by id or pickNumber
      if (a.type === 'message' && b.type === 'message') {
        return a.data.id - b.data.id
      } else if (a.type === 'pick' && b.type === 'pick') {
        return a.data.pickNumber - b.data.pickNumber
      }
      return 0
    })

    return items
  }, [messages, picks])

  // Auto-scroll to bottom when new messages arrive (unless user has scrolled up)
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const currentMessageCount = mergedItems.length
    const hadNewMessages = currentMessageCount > previousMessageCountRef.current
    previousMessageCountRef.current = currentMessageCount

    if (isUserScrolledUpRef.current) {
      // User is scrolled up - don't auto-scroll, but show indicator if new messages
      if (hadNewMessages) {
        setHasNewMessages(true)
      }
    } else {
      // User is at bottom - auto-scroll and clear indicator
      container.scrollTop = container.scrollHeight
      setHasNewMessages(false)
    }
  }, [mergedItems])

  // Check if scroll position requires gradient
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const checkScroll = () => {
      // Show gradient only when scrolled down (there's content above)
      setShowTopGradient(container.scrollTop > 0)

      // Check if user is at the bottom (within 50px threshold)
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        50
      isUserScrolledUpRef.current = !isAtBottom
      setShowScrollToBottom(!isAtBottom)

      // Clear new messages indicator when scrolling to bottom
      if (isAtBottom) {
        setHasNewMessages(false)
      }
    }

    // Check initially with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(checkScroll, 100)

    // Also check after a longer delay to catch any layout changes
    const timeoutId2 = setTimeout(checkScroll, 500)

    // Check on scroll
    container.addEventListener('scroll', checkScroll)

    // Check when content changes
    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(container)

    // Also observe DOM changes to catch when messages are added
    const mutationObserver = new MutationObserver(checkScroll)
    mutationObserver.observe(container, {
      childList: true,
      subtree: true
    })

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
      container.removeEventListener('scroll', checkScroll)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [mergedItems])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return

    await onSendMessage(newMessage)
    setNewMessage('')
  }

  function scrollToBottom() {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
      setHasNewMessages(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="h-[500px] overflow-y-auto space-y-2 px-3 bg-transparent rounded-md relative"
      >
        {/* Faded gradient at the top - only show when scrolled */}
        {showTopGradient && (
          <div className="sticky top-0 left-0 right-0 z-10 h-8 bg-gradient-to-b from-card via-card/80 to-transparent pointer-events-none" />
        )}
        {mergedItems.map((item, index) => {
          if (item.type === 'message') {
            const isOwnMessage = item.data.userId === currentUser
            return (
              <ChatBubble
                key={`message-${item.data.id}`}
                message={item.data.messageContent}
                username={userIdToName[item.data.userId] || 'Unknown'}
                isOwnMessage={isOwnMessage}
              />
            )
          } else {
            return (
              <PickMessage
                key={`pick-${item.data.pickNumber}-${index}`}
                username={item.data.clientName}
                pickText={item.data.payload}
              />
            )
          }
        })}

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <div className="sticky bottom-2 left-1/2 w-fit mx-auto z-20 pointer-events-none">
            <Button
              type="button"
              size="icon"
              onClick={scrollToBottom}
              className={`h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 border pointer-events-auto ${
                hasNewMessages
                  ? 'border-primary shadow-lg subtle-pulse'
                  : 'border-border/20'
              }`}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Input box - only show if user is joined */}
      {isJoined && (
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 pt-2 px-2 pb-4"
        >
          <Input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 border border-gray-400 rounded-md"
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 rounded-md bg-card text-primary hover:bg-card/80 flex-shrink-0 border border-border/20"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  )
}
