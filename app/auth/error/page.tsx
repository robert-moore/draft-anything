import { Card } from '@/components/ui/card'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="w-full max-w-md">
      <Card>
        <div className="text-center">
          <div className="relative w-16 h-16 rounded-full mx-auto mb-6">
            <div className="absolute -inset-[1px] rounded-full bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent opacity-100" />
            <div className="relative rounded-full bg-red-500/[0.08] backdrop-blur-sm w-full h-full flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-medium text-white/90 mb-2 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-white/60 leading-relaxed mb-8">
            {params?.error ? (
              <>We encountered an error: {params.error}</>
            ) : (
              <>An unexpected error occurred. Please try again.</>
            )}
            <br />
            <span className="text-xs text-white/40">
              Try refreshing the page.
            </span>
          </p>

          <div className="space-y-3">
            <Link href="/auth/login" className="relative block">
              <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-br from-white/[0.15] via-white/[0.05] to-transparent opacity-100" />
              <div className="relative bg-white/[0.02] border border-white/[0.08] text-white hover:bg-white/[0.05] transition-all duration-200 font-medium px-4 py-2.5 rounded-lg">
                Back to sign in
              </div>
            </Link>

            <p className="text-xs text-white/40">
              Need help?{' '}
              <Link
                href="/contact"
                className="text-white/70 hover:text-white/90 transition-colors duration-200 font-medium"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
