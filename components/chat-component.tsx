'use client'

import { useState } from 'react'
import ChatBubble from './chat-bubble'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface ChatMessage {
  id: number
  messageContent: string
  userId: string
  createdAt?: string
}

export default function ChatComponent({
  draftId,
  currentUser,
  messages,
  userIdToName,
  onSendMessage
}: {
  draftId: string
  currentUser: string | null
  messages: ChatMessage[]
  userIdToName: Record<string, string>
  onSendMessage: (messageContent: string) => Promise<void>
}) {
  const [newMessage, setNewMessage] = useState('')

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return

    await onSendMessage(newMessage)
    setNewMessage('')
  }

  return (
    <div className="flex flex-col my-2 space-y-2 h-[35rem]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 p-3 bg-transparent rounded-md h-80">
        {messages.map(message => {
          const isOwnMessage = message.userId === currentUser
          return (
            <ChatBubble
              key={message.id}
              message={message.messageContent}
              username={userIdToName[message.userId] || 'Unknown'}
              isOwnMessage={isOwnMessage}
            />
          )
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
        <Button type="submit" className="px-4 w-full rounded-md">
          Send
        </Button>
      </form>
    </div>
  )
}
