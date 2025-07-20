'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { NumberBox } from './number-box'

interface BrutalListItemProps {
  number: number | string
  children: ReactNode
  variant?: 'default' | 'minimal' | 'empty' | 'active' | 'highlighted'
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function BrutalListItem({
  number,
  children,
  variant = 'default',
  onClick,
  className,
  disabled = false
}: BrutalListItemProps) {
  const variantClasses = {
    default: 'border-2 border-border bg-card text-foreground hover:bg-muted',
    minimal: 'bg-background text-foreground',
    empty: 'border-2 border-border border-dashed bg-muted',
    active: 'border-2 border-border bg-accent text-accent-foreground',
    highlighted:
      'border-2 border-border bg-primary/20 text-foreground hover:bg-primary/30'
  }

  const Component = onClick ? 'button' : 'div'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <NumberBox
        number={number}
        size="sm"
        variant={variant === 'active' ? 'filled' : 'minimal'}
      />

      <Component
        className={cn(
          'flex-1 px-3 py-2 font-medium text-sm text-left transition-colors flex items-center',
          variantClasses[variant],
          onClick && !disabled && variant !== 'active' && 'cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={onClick}
        disabled={disabled}
      >
        {variant === 'empty' ? (
          <span className="text-muted-foreground text-xs">Empty</span>
        ) : (
          children
        )}
      </Component>
    </div>
  )
}
