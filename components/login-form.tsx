'use client'

import { BrutalButton } from '@/components/ui/brutal-button'
import { BrutalInput } from '@/components/ui/brutal-input'
import { useAuthRedirect } from '@/lib/hooks/use-auth-redirect'
import { createClient } from '@/lib/supabase/client'
import { getAppUrl } from '@/lib/utils/get-app-url'
import { cn } from '@/lib/utils/index'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { BrandLogo } from './brand'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/new'

  // Client-side protection: redirect if already authenticated
  useAuthRedirect(redirectTo)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(
            redirectTo
          )}`
        }
      })
      if (error) throw error
      setIsEmailSent(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn('flex flex-col items-center gap-6', className)}
      {...props}
    >
      <div className="w-full border-2 border-border bg-card">
        <div className="text-center p-8 border-b-2 border-border">
          <div className="text-2xl font-black tracking-tight mb-4 flex flex-col items-center justify-center gap-4">
            <BrandLogo variant="logo" size="2xl" />
            <span className="text-foreground">Welcome back</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isEmailSent
              ? 'Check your email for the magic link!'
              : 'Sign in to your account with a magic link'}
          </p>
        </div>
        <div className="p-8">
          {isEmailSent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Click the link in your email to sign in. You can close this
                window.
              </p>
              <BrutalButton
                variant="default"
                className="w-full"
                onClick={() => {
                  setIsEmailSent(false)
                  setEmail('')
                }}
              >
                Send another link
              </BrutalButton>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <BrutalInput
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  variant="boxed"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">
                  {error}
                  <br />
                  <span className="text-xs">Try refreshing the page.</span>
                </p>
              )}
              <BrutalButton
                type="submit"
                variant="filled"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending magic link...' : 'Send magic link'}
              </BrutalButton>
            </form>
          )}
          {!isEmailSent && (
            <div className="mt-6 text-center text-sm">
              <span className="text-foreground">
                Don&apos;t have an account?
              </span>{' '}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4 hover:no-underline text-foreground font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  )
}
