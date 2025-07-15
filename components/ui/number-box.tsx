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
    xs: 'min-w-[1.25rem] h-5 text-xs px-1',
    sm: 'min-w-[1.5rem] h-6 text-xs px-2',
    md: 'min-w-[2rem] h-8 text-sm px-3',
    lg: 'min-w-[2.5rem] h-10 text-base px-4'
  }

  const variantClasses = {
    default:
      'border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white',
    filled:
      'border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black',
    minimal: 'dark:bg-muted/20 text-black dark:text-white'
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
