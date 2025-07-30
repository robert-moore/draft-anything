import { BrandLogo } from '@/components/brand/brand-logo'
import { BrutalistButton } from '@/components/ui/brutalist-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function MarketingHeader() {
  return (
    <header className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/new">
              <BrutalistButton variant="primary" className="px-4 py-2">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">New Draft</span>
              </BrutalistButton>
            </Link>
            <Link href="/auth/login">
              <BrutalistButton variant="secondary">Sign In</BrutalistButton>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
