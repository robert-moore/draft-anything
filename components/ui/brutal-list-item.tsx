'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { NumberBox } from './number-box'

interface BrutalListItemProps {
  number: number | string
  children: ReactNode
  variant?: 'default' | 'minimal' | 'empty' | 'active'
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
    default:
      'border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-muted dark:hover:bg-muted/20',
    minimal: 'bg-white dark:bg-black text-black dark:text-white',
    empty:
      'border-2 border-black dark:border-white border-dashed bg-muted dark:bg-muted/20',
    active:
      'border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
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
