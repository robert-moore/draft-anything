import { cn } from '@/lib/utils'
import { Button, ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

interface BrutalistButtonProps extends ButtonProps {
  loading?: boolean
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'terminal' | 'danger' | 'ghost'
}

const BrutalistButton = forwardRef<HTMLButtonElement, BrutalistButtonProps>(
  ({ className, children, loading, icon, variant = 'primary', disabled, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return 'bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90 shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:shadow-[1px_1px_0px_0px_hsl(var(--border))] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]'
        case 'secondary':
          return 'bg-background text-foreground border-2 border-border hover:bg-accent hover:text-accent-foreground shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:shadow-[1px_1px_0px_0px_hsl(var(--border))] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]'
        case 'terminal':
          return 'bg-background text-primary border-2 border-primary hover:bg-primary/5 shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:shadow-[1px_1px_0px_0px_hsl(var(--primary))] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]'
        case 'danger':
          return 'bg-destructive text-destructive-foreground border-2 border-destructive hover:bg-destructive/90 shadow-[3px_3px_0px_0px_hsl(var(--destructive))] hover:shadow-[1px_1px_0px_0px_hsl(var(--destructive))] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]'
        case 'ghost':
          return 'bg-transparent text-foreground border-2 border-transparent hover:border-border hover:bg-accent hover:text-accent-foreground hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-[1px] hover:translate-y-[1px]'
        default:
          return ''
      }
    }

    return (
      <Button
        ref={ref}
        className={cn(
          // Base brutalist styles
          'font-bold uppercase tracking-wider transition-all duration-200 ease-out rounded-none relative group',
          // Remove default button styles
          'shadow-none hover:shadow-none',
          // Sharp focus ring
          'focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
          getVariantStyles(),
          loading && 'pointer-events-none opacity-50',
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
BrutalistButton.displayName = 'BrutalistButton'

export { BrutalistButton }