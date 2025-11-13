'use client'

import { useEffect, useState } from 'react'
import ChatBubble from './chat-bubble'
import { Button } from './ui/button'
import { Input } from './ui/input'

export default function ChatComponent({
  draftId,
  currentUser
}: {
  draftId: string
  currentUser: string | null
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')

  // Fetch all messages for this draft
  useEffect(() => {
    async function loadMessages() {
      const res = await fetch(`/api/drafts/${draftId}/messages`)
      const data = await res.json()
      setMessages(data.messages || [])
    }
    console.log(currentUser)
  }, [draftId])

  // Handle sending a new message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return

    await fetch(`/api/drafts/${draftId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageContent: newMessage })
    })

    // reload messages after sending
    const res = await fetch(`/api/drafts/${draftId}/messages`)
    const data = await res.json()
    setMessages(data.messages || [])
    setNewMessage('')
  }

  return (
    <div className="flex flex-col my-2 space-y-2 h-[35rem]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 p-3 bg-gray-50 rounded-md h-80 border">
        {messages.map(message => {
          const isOwnMessage = message.userId === currentUser
          return (
            <ChatBubble
              key={message.id}
              message={message.messageContent}
              username={message.draftUsername}
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
