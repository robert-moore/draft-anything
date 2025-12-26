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
          'max-w-52 rounded-xl px-2 py-1.5',
          isOwnMessage
            ? 'bg-[color-mix(in_srgb,hsl(var(--primary))_80%,black)] text-primary-foreground text-left'
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
