import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface BrutalistCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'terminal' | 'grid' | 'data' | 'alert'
  border?: 'single' | 'double' | 'thick' | 'dashed'
}

const BrutalistCard = forwardRef<HTMLDivElement, BrutalistCardProps>(
  ({ className, variant = 'default', border = 'single', children, ...props }, ref) => {
    const getBorderStyle = () => {
      switch (border) {
        case 'double':
          return 'border-4 border-double'
        case 'thick':
          return 'border-4'
        case 'dashed':
          return 'border-2 border-dashed'
        default:
          return 'border-2'
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Base brutalist styles
          'relative bg-background text-foreground',
          // No rounded corners - sharp edges only
          'rounded-none',
          // Border styles
          getBorderStyle(),
          'border-foreground',
          // Padding
          'p-6',
          // Variant styles
          {
            // Default clean brutalist
            'shadow-[3px_3px_0px_0px_hsl(var(--border))]': variant === 'default',
            // Terminal style - uses theme colors
            'bg-background text-primary border-primary font-mono shadow-[0_0_10px_0px_hsl(var(--primary)/0.3)]': variant === 'terminal',
            // Grid pattern
            'bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px]': variant === 'grid',
            // Data table style
            'border-collapse': variant === 'data',
            // Alert style
            'border-primary bg-primary/5 shadow-[4px_4px_0px_0px_hsl(var(--primary))]': variant === 'alert',
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
BrutalistCard.displayName = 'BrutalistCard'

export { BrutalistCard }