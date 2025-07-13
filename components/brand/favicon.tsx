'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

export interface FaviconProps {
  size?: number
  className?: string
  priority?: boolean
}

export function Favicon({
  size = 32,
  className,
  priority = false
}: FaviconProps) {
  return (
    <Image
      src="/brand/favicon.png"
      alt="Draft Anything favicon"
      width={size}
      height={size}
      className={cn('object-contain', className)}
      priority={priority}
    />
  )
}
