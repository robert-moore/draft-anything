'use client'

import { BrandLogo } from '@/components/brand'
import Link from 'next/link'

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="border-b-2 border-black dark:border-white bg-white dark:bg-black px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-70 transition-opacity duration-200"
          >
            <BrandLogo variant="wordmark" size="md" />
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
