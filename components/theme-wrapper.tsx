'use client'

import { useColorTheme } from '@/lib/theme/color-theme-context'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const { isLoaded } = useColorTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until both theme systems are ready
  if (!mounted || !isLoaded || !resolvedTheme) {
    return null
  }

  return <>{children}</>
}
