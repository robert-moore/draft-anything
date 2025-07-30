'use client'

import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/next'

export function ClientProviders() {
  return (
    <>
      <Toaster />
      <Analytics />
    </>
  )
}
