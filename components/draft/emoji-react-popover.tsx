import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Smile } from 'lucide-react'

const EMOJIS = [
  '👍', // thumbs up
  '👎', // thumbs down
  '🔥', // fire
  '🤡', // clown
  '🤯', // mind blown
  '🤔', // thinking
  '😢', // crying
  '💀', // skull
  '🤮', // vomiting
  '👏', // clapping
  '😂', // laughing with tears
  '🧠', // brain
  '🤩', // star eyes ⭐
  '❤️', // heart
  '💰', // money bag
  '💩', // poop
  '😈', // smiling devil
  '🥶', // cold face (icy take)
  '😤', // triumph face (try hard)
  '🎯' // bullseye (nailed it)
]

export function EmojiReactPopover({
  onReact,
  currentUserReactions = []
}: {
  onReact: (emoji: string, isActive: boolean) => void
  currentUserReactions?: string[]
}) {
  // The popover open/close state is managed by the parent (optional for now)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ml-1 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="React with emoji"
        >
          <Smile className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-3 grid grid-cols-4 grid-rows-3 gap-2 mr-2 sm:mr-0"
      >
        {EMOJIS.map(emoji => {
          const isActive = currentUserReactions.includes(emoji)
          return (
            <button
              key={emoji}
              className={`text-lg transition-transform p-2 rounded-full focus:outline-none ${
                isActive
                  ? 'bg-accent scale-110 ring ring-primary'
                  : 'hover:scale-125 hover:bg-accent'
              }`}
              onClick={() => onReact(emoji, isActive)}
              type="button"
            >
              {emoji}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
