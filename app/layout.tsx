import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { autoPickScheduler } from '@/lib/auto-pick-scheduler'
import { ColorThemeProvider } from '@/lib/theme/color-theme-context'
import { cn } from '@/lib/utils'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk as FontSans } from 'next/font/google'
import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800']
})

const title = 'Draft Anything'
const description = 'Draft anything with friends.'

export const metadata: Metadata = {
  metadataBase: new URL('https://draftanything.io'),
  title,
  description,
  icons: {
    icon: '/brand/favicon.png',
    shortcut: '/brand/favicon.png',
    apple: '/brand/icon-dark.png'
  },
  openGraph: {
    title,
    description
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    creator: '@robmoo_re'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Start the auto-pick scheduler on the server side
  if (typeof window === 'undefined') {
    // Only start on server side
    autoPickScheduler.start()
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen flex flex-col font-sans antialiased',
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
            {children}
            <Toaster />
            <Analytics />
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
