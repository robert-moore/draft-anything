'use client'

import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export interface DeriveLogoProps {
  variant?: 'logo' | 'wordmark' | 'icon'
  theme?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  priority?: boolean
}

// Calculate dimensions based on actual aspect ratios
// Logo: 855 x 1138 (aspect ratio ~0.751)
// Wordmark: 1497 x 582 (aspect ratio ~2.572)
// Icon: 1:1 square
const getDimensions = (variant: string, size: string) => {
  const logoAspectRatio = 855 / 1138 // ~0.751
  const wordmarkAspectRatio = 1497 / 582 // ~2.572

  const baseSizes = {
    sm: { logo: 24, wordmark: 20, icon: 24 },
    md: { logo: 32, wordmark: 28, icon: 32 },
    lg: { logo: 40, wordmark: 36, icon: 40 },
    xl: { logo: 48, wordmark: 44, icon: 48 },
    '2xl': { logo: 56, wordmark: 52, icon: 56 }
  }

  const height =
    baseSizes[size as keyof typeof baseSizes][
      variant as keyof typeof baseSizes.sm
    ]

  switch (variant) {
    case 'logo':
      return {
        width: Math.round(height * logoAspectRatio),
        height
      }
    case 'wordmark':
      return {
        width: Math.round(height * wordmarkAspectRatio),
        height
      }
    case 'icon':
    default:
      return {
        width: height,
        height
      }
  }
}

export function DeriveLogo({
  variant = 'logo',
  theme = 'auto',
  size = 'md',
  className,
  priority = false
}: DeriveLogoProps) {
  const { resolvedTheme } = useTheme()

  // Determine which logo to show based on theme
  // For dark backgrounds, show light logo and vice versa
  const getThemeVariant = () => {
    if (theme === 'light') return 'light'
    if (theme === 'dark') return 'dark'
    // Auto mode: show dark logo on dark theme, light logo on light theme
    return resolvedTheme === 'light' ? 'dark' : 'light'
  }

  const themeVariant = getThemeVariant()
  const dimensions = getDimensions(variant, size)

  // Get the appropriate image path
  const getImagePath = () => {
    switch (variant) {
      case 'icon':
        return `/brand/icon-${themeVariant}.png`
      case 'wordmark':
        return `/brand/wordmark-${themeVariant}.svg`
      case 'logo':
      default:
        return `/brand/logo-${themeVariant}.svg`
    }
  }

  const getAltText = () => {
    switch (variant) {
      case 'icon':
        return 'Derive icon'
      case 'wordmark':
        return 'Derive wordmark'
      case 'logo':
      default:
        return 'Derive logo'
    }
  }

  return (
    <Image
      src={getImagePath()}
      alt={getAltText()}
      width={dimensions.width}
      height={dimensions.height}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`
      }}
      className={cn('object-contain', className)}
      priority={priority}
    />
  )
}
