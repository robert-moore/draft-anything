'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

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
      alt="Derive favicon"
      width={size}
      height={size}
      className={cn('object-contain', className)}
      priority={priority}
    />
  )
}