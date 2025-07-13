import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ComparisonCardProps {
  variant?: 'traditional' | 'derive'
  children: ReactNode
  className?: string
}

export function ComparisonCard({ 
  variant = 'traditional', 
  children, 
  className 
}: ComparisonCardProps) {
  if (variant === 'derive') {
    return (
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg blur-xl animate-pulse" />
        <div className={cn(
          "relative bg-white/5 dark:bg-purple-900/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 shadow-lg shadow-purple-500/10",
          className
        )}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-muted/20 rounded-lg blur-xl" />
      <div className={cn(
        "relative bg-white/5 dark:bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-6",
        className
      )}>
        {children}
      </div>
    </div>
  )
}