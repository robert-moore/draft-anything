import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'setting_up' | 'active' | 'completed' | 'paused' | 'canceled'
  pulse?: boolean
}

const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, pulse = false, children, ...props }, ref) => {
    const getStatusStyles = (status: string) => {
      switch (status) {
        case 'setting_up':
          return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30'
        case 'active':
          return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
        case 'completed':
          return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30'
        case 'paused':
          return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30'
        case 'canceled':
          return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/30'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/30'
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
          getStatusStyles(status),
          pulse && status === 'setting_up' && 'animate-pulse',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            {
              'bg-amber-500 dark:bg-amber-400': status === 'setting_up',
              'bg-green-500 dark:bg-green-400': status === 'active',
              'bg-blue-500 dark:bg-blue-400': status === 'completed',
              'bg-orange-500 dark:bg-orange-400': status === 'paused',
              'bg-gray-500 dark:bg-gray-400': status === 'canceled',
            }
          )}
        />
        {children || status.replace('_', ' ')}
      </div>
    )
  }
)
StatusBadge.displayName = 'StatusBadge'

export { StatusBadge }