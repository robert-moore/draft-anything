import { AppHeader } from '@/components/app-header'
import { ThemeProvidersClient } from '@/components/theme-providers-client'

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvidersClient>
      <div className="min-h-screen bg-background">
        <AppHeader />
        {/* Main content */}
        <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </ThemeProvidersClient>
  )
}
