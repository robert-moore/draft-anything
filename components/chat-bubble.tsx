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
          'max-w-52 rounded-none px-3 py-1.5',
          isOwnMessage
            ? 'bg-primary/20 text-foreground text-left'
            : 'bg-muted text-foreground text-left'
        )}
      >
        <div
          className={cn(
            'font-bold text-xs pt-0.5',
            isOwnMessage ? 'hidden' : ''
          )}
        >
          {username}
        </div>
        <div>{message}</div>
      </div>
    </div>
  )
}

export default ChatBubble
