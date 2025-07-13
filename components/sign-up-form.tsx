'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthRedirect } from '@/lib/hooks/use-auth-redirect'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/index'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BrandLogo } from './brand'

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const router = useRouter()

  // Client-side protection: redirect if already authenticated
  useAuthRedirect('/new')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/new`
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
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex flex-col items-center justify-center gap-4">
            <BrandLogo variant="logo" size="2xl" />
            Create an account
          </CardTitle>
          <CardDescription>
            {isEmailSent 
              ? 'Check your email for the magic link!' 
              : 'Enter your email to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmailSent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Click the link in your email to create your account and sign in.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsEmailSent(false)
                  setEmail('')
                }}
              >
                Send another link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending magic link...' : 'Send magic link'}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <div className="text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  )
}
