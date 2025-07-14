import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface DotDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'dots' | 'double' | 'margin'
  label?: string
}

const DotDivider = forwardRef<HTMLDivElement, DotDividerProps>(
  ({ className, variant = 'line', label, ...props }, ref) => {
    if (variant === 'dots') {
      return (
        <div
          ref={ref}
          className={cn('flex items-center justify-center py-4', className)}
          {...props}
        >
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-muted-foreground rounded-full" />
            ))}
          </div>
        </div>
      )
    }

    if (variant === 'double') {
      return (
        <div
          ref={ref}
          className={cn('py-4', className)}
          {...props}
        >
          <div className="space-y-2">
            <div className="h-px bg-border" />
            <div className="h-px bg-border" />
          </div>
        </div>
      )
    }

    if (variant === 'margin') {
      return (
        <div
          ref={ref}
          className={cn('relative py-4', className)}
          {...props}
        >
          <div className="h-px bg-border" />
          <div className="absolute left-8 top-1/2 bottom-0 w-px bg-border opacity-30" />
        </div>
      )
    }

    // Default line variant
    return (
      <div
        ref={ref}
        className={cn('relative py-4', className)}
        {...props}
      >
        <div className="h-px bg-border" />
        {label && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-background px-3 text-sm text-muted-foreground font-mono">
              {label}
            </span>
          </div>
        )}
      </div>
    )
  }
)
DotDivider.displayName = 'DotDivider'

export { DotDivider }