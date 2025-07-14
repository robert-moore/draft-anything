'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'filled' | 'text'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variantClasses = {
      default: 'brutal-button',
      filled: 'border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-sm tracking-wider transition-colors',
      text: 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors font-bold text-xs tracking-wider'
    }

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm', 
      lg: 'px-4 py-3 text-base'
    }

    return (
      <button
        className={cn(
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          variant !== 'text' && sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

BrutalButton.displayName = 'BrutalButton'