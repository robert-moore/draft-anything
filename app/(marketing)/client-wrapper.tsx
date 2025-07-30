'use client'

import { ClientProviders } from '@/components/client-providers'
import { MarketingHeaderClient } from '@/components/marketing/marketing-header-client'
import { ThemeProvidersClient } from '@/components/theme-providers-client'

export function MarketingClientWrapper({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvidersClient>
      <div className="min-h-screen bg-background">
        <MarketingHeaderClient />
        {children}
      </div>
      <ClientProviders />
    </ThemeProvidersClient>
  )
}
