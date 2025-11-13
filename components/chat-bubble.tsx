import { cn } from '@/lib/utils'

type ChatBubbleProps = {
  message: string
  username: string
  isOwnMessage?: boolean
}

const ChatBubble = ({ message, username, isOwnMessage }: ChatBubbleProps) => {
  return (
    <div
      className={cn(
        'flex w-full',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-52 rounded-xl p-2',
          isOwnMessage
            ? 'bg-blue-500 text-white text-left'
            : 'bg-gray-200 text-gray-900 text-left'
        )}
      >
        <div className={cn('font-bold text-xs', isOwnMessage ? 'hidden' : '')}>
          {username}
        </div>
        <div>{message}</div>
      </div>
    </div>
  )
}

export default ChatBubble
