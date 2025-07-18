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
    bordered: 'border-2 border-border',
    clean: ''
  }

  const bgClasses = {
    white: 'bg-card',
    muted: 'bg-muted',
    diagonal: 'bg-card relative'
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
        <div className="border-b-2 border-border px-4 py-3 bg-card relative z-10">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-wider uppercase text-foreground">
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