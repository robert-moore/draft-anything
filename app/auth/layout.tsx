'use client'

import { AnimatedWrapper } from '@/components/auth/animated-wrapper'
import { BrandLogo } from '@/components/brand'
import { AnimatedBackdrop } from '@/components/ui/animated-backdrop'
import Link from 'next/link'

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <AnimatedBackdrop>
        {/* Navigation */}
        <nav className="relative z-50 px-8 py-6 border-b border-border/50">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-70 transition-opacity duration-200"
            >
              <BrandLogo variant="logo" size="md" />
              <span className="text-base font-medium tracking-tight text-foreground/90">
                Draft Anything
              </span>
            </Link>
          </div>
        </nav>

        {/* Main content */}
        <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-sm">
            <AnimatedWrapper>{children}</AnimatedWrapper>
          </div>
        </main>
      </AnimatedBackdrop>
    </div>
  )
}
