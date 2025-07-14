import { cn } from '@/lib/utils'
import { Button, ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

interface GeometricButtonProps extends ButtonProps {
  loading?: boolean
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ink'
}

const GeometricButton = forwardRef<HTMLButtonElement, GeometricButtonProps>(
  ({ className, children, loading, icon, variant = 'primary', disabled, ...props }, ref) => {
    const getVariantStyles = (variant: string) => {
      switch (variant) {
        case 'primary':
          return 'bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90 hover:text-primary-foreground'
        case 'secondary':
          return 'bg-secondary text-secondary-foreground border-2 border-secondary hover:bg-secondary/80 hover:text-secondary-foreground'
        case 'outline':
          return 'border-2 border-primary text-primary bg-transparent hover:bg-primary/10 hover:text-primary'
        case 'ghost':
          return 'border-2 border-transparent text-foreground bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-border'
        case 'ink':
          return 'bg-foreground text-background border-2 border-foreground hover:bg-foreground/90 hover:text-background'
        default:
          return 'bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90 hover:text-primary-foreground'
      }
    }

    return (
      <Button
        ref={ref}
        className={cn(
          // Base geometric styles - sharp corners, clean lines
          'font-medium transition-all duration-150 rounded-none relative',
          // Remove default button styles
          'shadow-none hover:shadow-none',
          // Sharp focus ring
          'focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
          // Geometric hover effect
          'hover:translate-x-px hover:translate-y-px',
          'active:translate-x-0 active:translate-y-0',
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
        
        {/* Geometric accent corner */}
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-current opacity-20" />
      </Button>
    )
  }
)
GeometricButton.displayName = 'GeometricButton'

export { GeometricButton }