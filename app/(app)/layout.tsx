import { AppHeader } from '@/components/app-header'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}