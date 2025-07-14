import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface JournalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  meta?: string
  date?: string
  page?: string
}

const JournalHeader = forwardRef<HTMLDivElement, JournalHeaderProps>(
  ({ className, title, meta, date, page, ...props }, ref) => {
    const today = new Date().toISOString().split('T')[0]
    
    return (
      <div
        ref={ref}
        className={cn('border-b border-border pb-4 mb-6', className)}
        {...props}
      >
        {/* Header line with date and page */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2">
          <span>DATE: {date || today}</span>
          {page && <span>PAGE: {page.padStart(3, '0')}</span>}
        </div>
        
        {/* Main title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-wide uppercase">
            {title}
          </h1>
          {meta && (
            <p className="text-sm text-muted-foreground font-mono">
              {meta}
            </p>
          )}
        </div>
        
        {/* Underline with dots */}
        <div className="flex items-center gap-1 mt-3">
          <div className="flex-1 h-px bg-border" />
          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>
    )
  }
)
JournalHeader.displayName = 'JournalHeader'

export { JournalHeader }