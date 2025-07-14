'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface BrutalSectionProps {
  title?: string
  children: ReactNode
  headerActions?: ReactNode
  className?: string
  contentClassName?: string
  variant?: 'default' | 'bordered' | 'clean'
  background?: 'white' | 'muted' | 'diagonal'
}

export function BrutalSection({ 
  title,
  children,
  headerActions,
  className,
  contentClassName,
  variant = 'default',
  background = 'white'
}: BrutalSectionProps) {
  const variantClasses = {
    default: '',
    bordered: 'border-2 border-black dark:border-white',
    clean: ''
  }

  const bgClasses = {
    white: 'bg-white dark:bg-black',
    muted: 'bg-muted dark:bg-muted/20',
    diagonal: 'bg-white dark:bg-black relative'
  }

  return (
    <div 
      className={cn(
        variantClasses[variant],
        bgClasses[background],
        className
      )}
    >
      {background === 'diagonal' && (
        <div className="diagonal-lines absolute inset-0 pointer-events-none" />
      )}
      
      {title && (
        <div className="border-b-2 border-black dark:border-white px-4 py-3 bg-white dark:bg-black relative z-10">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-wider uppercase text-black dark:text-white">
              {title}
            </h3>
            {headerActions}
          </div>
        </div>
      )}
      
      <div className={cn('relative z-10', contentClassName)}>
        {children}
      </div>
    </div>
  )
}