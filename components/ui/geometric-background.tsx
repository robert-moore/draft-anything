import { cn } from '@/lib/utils'

interface GeometricBackgroundProps {
  className?: string
  variant?: 'diagonal' | 'grid' | 'dots' | 'lines'
  opacity?: number
}

export function GeometricBackground({ 
  className,
  variant = 'diagonal',
  opacity = 0.1
}: GeometricBackgroundProps) {
  const variants = {
    diagonal: 'bg-[linear-gradient(45deg,transparent_48%,#000_48%,#000_52%,transparent_52%),linear-gradient(-45deg,transparent_48%,#000_48%,#000_52%,transparent_52%)] dark:bg-[linear-gradient(45deg,transparent_48%,#fff_48%,#fff_52%,transparent_52%),linear-gradient(-45deg,transparent_48%,#fff_48%,#fff_52%,transparent_52%)] bg-[size:8px_8px]',
    grid: 'bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:20px_20px]',
    dots: 'bg-[radial-gradient(circle,#000_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-[size:16px_16px]',
    lines: 'bg-[linear-gradient(to_right,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px)] bg-[size:8px_100%]'
  }

  return (
    <div 
      className={cn(
        'absolute inset-0 pointer-events-none',
        variants[variant],
        className
      )}
      style={{ opacity }}
    />
  )
}