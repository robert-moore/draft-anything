'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Hook to redirect authenticated users away from auth pages
 * This serves as a client-side fallback to the server-side redirect
 */
export function useAuthRedirect(redirectTo: string = '/new') {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (user) {
        router.push(redirectTo)
      }
    }

    // Check immediately
    checkAuth()

    // Also listen for auth state changes
    const supabase = createClient()
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push(redirectTo)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, redirectTo])
}
