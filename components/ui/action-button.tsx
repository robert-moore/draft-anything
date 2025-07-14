import { cn } from '@/lib/utils'
import { Button, ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

interface ActionButtonProps extends ButtonProps {
  loading?: boolean
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, children, loading, icon, variant = 'primary', disabled, ...props }, ref) => {
    const getVariantStyles = (variant: string) => {
      switch (variant) {
        case 'primary':
          return 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl'
        case 'secondary':
          return 'border-2 border-primary text-primary bg-transparent hover:bg-primary/5 hover:border-primary/70'
        case 'success':
          return 'bg-green-600 text-white hover:bg-green-500 shadow-lg hover:shadow-xl'
        case 'warning':
          return 'bg-amber-600 text-white hover:bg-amber-500 shadow-lg hover:shadow-xl'
        case 'danger':
          return 'bg-red-600 text-white hover:bg-red-500 shadow-lg hover:shadow-xl'
        case 'ghost':
          return 'bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
        default:
          return 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl'
      }
    }

    return (
      <Button
        ref={ref}
        className={cn(
          'relative font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
          'focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
          getVariantStyles(variant),
          loading && 'pointer-events-none',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </Button>
    )
  }
)
ActionButton.displayName = 'ActionButton'

export { ActionButton }