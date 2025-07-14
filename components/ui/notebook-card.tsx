import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface NotebookCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'lined' | 'margin' | 'grid'
  size?: 'sm' | 'md' | 'lg'
}

const NotebookCard = forwardRef<HTMLDivElement, NotebookCardProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles - sharp corners, clean lines
          'border border-border bg-card text-card-foreground relative',
          // No rounded corners for notebook feel
          'rounded-none',
          // Size variants
          {
            'p-4': size === 'sm',
            'p-6': size === 'md', 
            'p-8': size === 'lg',
          },
          // Variant styles
          {
            // Default clean card
            'border border-border': variant === 'default',
            // Lined paper effect
            'border border-border relative': variant === 'lined',
            // Left margin line like notebook
            'border border-border pl-12 relative': variant === 'margin',
            // Dot grid background
            'border border-border bg-dot-grid': variant === 'grid',
          },
          className
        )}
        style={{
          ...(variant === 'grid' && {
            backgroundImage: `radial-gradient(circle at 24px 24px, hsl(var(--muted-foreground) / 0.2) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          })
        }}
        {...props}
      >
        {/* Margin line for notebook effect */}
        {variant === 'margin' && (
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border opacity-30" />
        )}
        
        {/* Ruled lines for lined paper effect */}
        {variant === 'lined' && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-border opacity-20"
                style={{ top: `${(i + 1) * 24}px` }}
              />
            ))}
          </div>
        )}
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)
NotebookCard.displayName = 'NotebookCard'

export { NotebookCard }