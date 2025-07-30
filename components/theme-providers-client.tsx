'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { ThemeWrapper } from '@/components/theme-wrapper'
import { ColorThemeProvider } from '@/lib/theme/color-theme-context'

export function ThemeProvidersClient({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <ColorThemeProvider>
        <ThemeWrapper>{children}</ThemeWrapper>
      </ColorThemeProvider>
    </ThemeProvider>
  )
}
