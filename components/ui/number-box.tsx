'use client'

import { cn } from '@/lib/utils'

interface NumberBoxProps {
  number: number | string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'minimal'
  className?: string
}

export function NumberBox({
  number,
  size = 'sm',
  variant = 'default',
  className
}: NumberBoxProps) {
  const sizeClasses = {
    xs: 'w-[1.25rem] h-5 text-xs px-1',
    sm: 'w-[2rem] h-6 text-xs px-2',
    md: 'w-[2.5rem] h-8 text-sm px-3',
    lg: 'w-[3rem] h-10 text-base px-4'
  }

  const variantClasses = {
    default: 'border-2 border-border bg-card text-foreground',
    filled: 'border-2 border-border bg-accent text-accent-foreground',
    minimal: 'bg-transparent text-foreground'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center font-bold font-mono select-none',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {number}
    </div>
  )
}
