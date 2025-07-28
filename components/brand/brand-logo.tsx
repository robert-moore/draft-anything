'use client'

import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export interface BrandLogoProps {
  variant?: 'logo' | 'wordmark'
  theme?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  priority?: boolean
}

const getDimensions = (variant: string, size: string) => {
  const baseDimensions = {
    logo: {
      sm: { width: 120, height: 30 },
      md: { width: 160, height: 40 },
      lg: { width: 200, height: 50 },
      xl: { width: 240, height: 60 },
      '2xl': { width: 280, height: 70 }
    },
    wordmark: {
      sm: { width: 120, height: 30 },
      md: { width: 160, height: 40 },
      lg: { width: 200, height: 50 },
      xl: { width: 240, height: 60 },
      '2xl': { width: 280, height: 70 }
    },
    icon: {
      sm: { width: 24, height: 24 },
      md: { width: 32, height: 32 },
      lg: { width: 48, height: 48 },
      xl: { width: 64, height: 64 },
      '2xl': { width: 80, height: 80 }
    }
  }

  return (
    baseDimensions[variant as keyof typeof baseDimensions]?.[
      size as keyof typeof baseDimensions.logo
    ] || baseDimensions.logo.md
  )
}

export function BrandLogo({
  variant = 'logo',
  theme = 'auto',
  size = 'md',
  className,
  priority = false
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to show based on theme
  // For dark backgrounds, show light logo and vice versa
  const getThemeVariant = () => {
    if (theme === 'light') return 'light'
    if (theme === 'dark') return 'dark'
    // Auto mode: show light logo on dark theme, dark logo on light theme
    // Default to light logo since we're using dark theme by default
    if (!mounted) return 'light' // Default to light logo during SSR
    return resolvedTheme === 'dark' ? 'light' : 'dark'
  }

  const themeVariant = getThemeVariant()
  const dimensions = getDimensions(variant, size)

  // Get the appropriate image path
  const getImagePath = () => {
    switch (variant) {
      case 'wordmark':
        return `/brand/wordmark-${themeVariant}.svg`
      case 'logo':
      default:
        return `/brand/logo-${themeVariant}.svg`
    }
  }

  const getAltText = () => {
    switch (variant) {
      case 'wordmark':
        return 'Draft Anything wordmark'
      case 'logo':
      default:
        return 'Draft Anything logo'
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
