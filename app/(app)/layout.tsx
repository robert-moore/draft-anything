import { AppHeader } from '@/components/app-header'
import { ThemeProvidersClient } from '@/components/theme-providers-client'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvidersClient>
      <div className="min-h-screen bg-background">
        <AppHeader />
        {children}
      </div>
    </ThemeProvidersClient>
  )
}
