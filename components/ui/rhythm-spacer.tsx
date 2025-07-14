import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface RhythmSpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'invisible' | 'line' | 'dots'
}

const RhythmSpacer = forwardRef<HTMLDivElement, RhythmSpacerProps>(
  ({ className, size = 'md', variant = 'invisible', ...props }, ref) => {
    const getSizeClass = () => {
      switch (size) {
        case 'xs': return 'h-2'
        case 'sm': return 'h-4'
        case 'md': return 'h-8'
        case 'lg': return 'h-16'
        case 'xl': return 'h-24'
        case '2xl': return 'h-32'
        default: return 'h-8'
      }
    }

    const getVariantContent = () => {
      switch (variant) {
        case 'line':
          return <div className="h-px bg-border w-full" />
        case 'dots':
          return (
            <div className="flex items-center justify-center gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            </div>
          )
        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center',
          getSizeClass(),
          className
        )}
        {...props}
      >
        {getVariantContent()}
      </div>
    )
  }
)
RhythmSpacer.displayName = 'RhythmSpacer'

export { RhythmSpacer }