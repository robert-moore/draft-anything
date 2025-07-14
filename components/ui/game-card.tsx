import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'highlight'
  size?: 'sm' | 'md' | 'lg'
}

const GameCard = forwardRef<HTMLDivElement, GameCardProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-xl border bg-card text-card-foreground transition-all duration-200',
          // Size variants
          {
            'p-4': size === 'sm',
            'p-6': size === 'md',
            'p-8': size === 'lg',
          },
          // Variant styles
          {
            'shadow-sm hover:shadow-md': variant === 'default',
            'shadow-md hover:shadow-lg hover:scale-[1.02] cursor-pointer': variant === 'interactive',
            'shadow-lg ring-2 ring-primary/20 bg-primary/5': variant === 'highlight',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GameCard.displayName = 'GameCard'

export { GameCard }