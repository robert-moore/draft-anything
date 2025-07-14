import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface PlayerAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'ready' | 'away' | 'offline'
  showStatus?: boolean
}

const PlayerAvatar = forwardRef<HTMLDivElement, PlayerAvatarProps>(
  ({ className, name, size = 'md', status, showStatus = false, ...props }, ref) => {
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    const getSizeStyles = (size: string) => {
      switch (size) {
        case 'sm':
          return 'w-8 h-8 text-xs'
        case 'lg':
          return 'w-12 h-12 text-lg'
        default:
          return 'w-10 h-10 text-sm'
      }
    }

    const getStatusColor = (status?: string) => {
      switch (status) {
        case 'online':
          return 'bg-green-500'
        case 'ready':
          return 'bg-blue-500'
        case 'away':
          return 'bg-yellow-500'
        case 'offline':
          return 'bg-gray-400'
        default:
          return 'bg-gray-400'
      }
    }

    const getStatusSize = (size: string) => {
      switch (size) {
        case 'sm':
          return 'w-2 h-2'
        case 'lg':
          return 'w-3 h-3'
        default:
          return 'w-2.5 h-2.5'
      }
    }

    return (
      <div ref={ref} className={cn('relative inline-block', className)} {...props}>
        <div
          className={cn(
            'rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-medium text-primary transition-all duration-200 hover:scale-105 hover:shadow-md',
            getSizeStyles(size)
          )}
        >
          {getInitials(name)}
        </div>
        {showStatus && status && (
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background',
              getStatusColor(status),
              getStatusSize(size)
            )}
          />
        )}
      </div>
    )
  }
)
PlayerAvatar.displayName = 'PlayerAvatar'

export { PlayerAvatar }