'use client'

import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes } from 'react'

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'underline' | 'boxed'
}

export const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ className, variant = 'underline', ...props }, ref) => {
    const variantClasses = {
      underline: 'brutal-input',
      boxed: 'border-2 border-black dark:border-white px-3 py-2 bg-white dark:bg-black text-black dark:text-white font-bold'
    }

    return (
      <input
        className={cn(
          'transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-bold placeholder:tracking-wider disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

BrutalInput.displayName = 'BrutalInput'