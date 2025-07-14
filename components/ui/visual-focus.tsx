import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface VisualFocusProps extends React.HTMLAttributes<HTMLDivElement> {
  priority?: 'primary' | 'secondary' | 'tertiary'
  direction?: 'vertical' | 'horizontal' | 'corner'
}

const VisualFocus = forwardRef<HTMLDivElement, VisualFocusProps>(
  (
    {
      className,
      priority = 'primary',
      direction = 'corner',
      children,
      ...props
    },
    ref
  ) => {
    const getPriorityStyles = () => {
      switch (priority) {
        case 'primary':
          return 'border-primary bg-primary/5 dark:bg-white/5 shadow-[4px_4px_0px_0px_hsl(var(--primary))]'
        case 'secondary':
          return 'border-border bg-background shadow-[2px_2px_0px_0px_hsl(var(--border))]'
        case 'tertiary':
          return 'border-border/50 bg-muted/30 shadow-[1px_1px_0px_0px_hsl(var(--border))]'
        default:
          return ''
      }
    }

    const getDirectionAccent = () => {
      switch (direction) {
        case 'vertical':
          return (
            <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary" />
          )
        case 'horizontal':
          return (
            <div className="absolute top-0 left-2 right-2 h-1 bg-primary" />
          )
        case 'corner':
          return <div className="absolute top-0 right-0 w-4 h-4 bg-primary" />
        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative border-2 p-6 rounded-none',
          getPriorityStyles(),
          className
        )}
        {...props}
      >
        {priority === 'primary' && getDirectionAccent()}
        {children}
      </div>
    )
  }
)
VisualFocus.displayName = 'VisualFocus'

export { VisualFocus }
