import { ThemeProvider } from '@/components/theme-provider'
import { ThemeWrapper } from '@/components/theme-wrapper'
import { Toaster } from '@/components/ui/sonner'
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
  metadataBase: new URL('https://draft-anything.vercel.app'),
  title,
  description,
  icons: {
    icon: '/brand/favicon.png',
    shortcut: '/brand/favicon.png',
    apple: '/brand/icon-dark.png'
  },
  openGraph: {
    title,
    description,
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Draft Anything'
      }
    ]
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
  // autoPickScheduler.start() // Disabled: autopick is now handled by a Vercel cron job (see /api/cron/auto-pick and vercel.json)

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
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          <ColorThemeProvider>
            <ThemeWrapper>
              {children}
              <Toaster />
              <Analytics />
            </ThemeWrapper>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
