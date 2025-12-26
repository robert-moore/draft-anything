'use client'

import { parseTimestamp } from '@/lib/utils/timestamp'
import { DraftPick } from '@/types/draft'
import { useMemo, useState } from 'react'
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
  onSendMessage
}: {
  draftId: string
  currentUser: string | null
  messages: ChatMessage[]
  picks?: DraftPick[]
  userIdToName: Record<string, string>
  onSendMessage: (messageContent: string) => Promise<void>
}) {
  const [newMessage, setNewMessage] = useState('')

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

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return

    await onSendMessage(newMessage)
    setNewMessage('')
  }

  return (
    <div className="flex flex-col my-2 space-y-2 h-[35rem]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-transparent rounded-md h-80">
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
      </div>

      {/* Input box */}
      <form
        onSubmit={handleSendMessage}
        className="flex flex-col items-center gap-2 border-t border-gray-300 pt-2 px-2"
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
          className="px-4 w-full rounded-md bg-[color-mix(in_srgb,hsl(var(--primary))_80%,black)] text-primary-foreground hover:bg-[color-mix(in_srgb,hsl(var(--primary))_75%,black)]"
        >
          Send
        </Button>
      </form>
    </div>
  )
}
