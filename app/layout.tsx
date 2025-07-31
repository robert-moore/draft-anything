import { ClientProviders } from '@/components/client-providers'
import { cn } from '@/lib/utils'
import type { Viewport } from 'next'
import { Hanken_Grotesk as FontSans } from 'next/font/google'
import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800']
})

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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Draft Anything</title>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/brand/favicon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/brand/favicon.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/brand/favicon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/brand/favicon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/brand/favicon.png"
        />

        {/* 
          Bypass Next.js 15's metadata injection via JavaScript by using dangerouslySetInnerHTML.
          This ensures OG meta tags are present in the initial HTML for crawlers and social media platforms.
          Next.js 15 streams metadata via JavaScript, which can cause issues with SEO and social sharing.
        */}
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <meta property="og:title" content="Draft Anything" />
              <meta property="og:description" content="Draft anything with friends." />
              <meta property="og:image" content="https://draft-anything.vercel.app/images/og-image.png" />
              <meta property="og:image:width" content="1200" />
              <meta property="og:image:height" content="630" />
              <meta property="og:image:alt" content="Draft Anything" />
              <meta property="og:type" content="website" />
              <meta property="og:url" content="https://draftanything.io" />
              
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:creator" content="@robmoo_re" />
              <meta name="twitter:title" content="Draft Anything" />
              <meta name="twitter:description" content="Draft anything with friends." />
              <meta name="twitter:image" content="https://draft-anything.vercel.app/images/og-image.png" />
              <meta name="twitter:image:width" content="1200" />
              <meta name="twitter:image:height" content="630" />
              <meta name="twitter:image:alt" content="Draft Anything" />
            `
          }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen flex flex-col font-sans antialiased',
          fontSans.variable
        )}
      >
        {children}
        <ClientProviders />
      </body>
    </html>
  )
}
