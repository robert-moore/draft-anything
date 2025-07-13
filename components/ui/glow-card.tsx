'use client'

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

const glowCardVariants = cva('relative rounded-2xl border', {
  variants: {
    variant: {
      default: 'border-white/[0.08]',
      success: 'border-white/[0.12]',
      neutral: 'border-white/[0.10]',
      featured: 'border-white/[0.15]'
    },
    size: {
      default: 'p-8',
      compact: 'p-6',
      large: 'p-10'
    },
    height: {
      full: 'h-full',
      auto: 'h-auto'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    height: 'full'
  }
})

interface GlowCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glowCardVariants> {
  accentColor?: 'green' | 'red' | 'none'
  lightBeamWidth?: 'sm' | 'md' | 'lg'
}

const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  (
    {
      className,
      variant,
      size,
      height,
      accentColor = 'none',
      lightBeamWidth = 'md',
      children,
      ...props
    },
    ref
  ) => {
    // Background gradient based on variant
    const backgroundStyle = {
      default: `radial-gradient(41.07% 8.33% at 50% 0%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(rgb(16, 16, 16) 0%, rgba(0, 0, 0, 0.8) 100())`,
      success: `radial-gradient(41.07% 8.33% at 50% 0%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(rgb(18, 18, 18) 0%, rgba(0, 0, 0, 0.9) 100())`,
      neutral: `radial-gradient(41.07% 8.33% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(rgb(18, 18, 18) 0%, rgba(0, 0, 0, 0.9) 100())`,
      featured: `radial-gradient(41.07% 8.33% at 50% 0%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(rgb(22, 22, 22) 0%, rgba(0, 0, 0, 0.95) 100%)`
    }

    // Light beam widths
    const beamWidths = {
      sm: { main: 'w-[200px] md:w-[250px]', accent: 'w-[150px] md:w-[200px]' },
      md: { main: 'w-[250px] md:w-[350px]', accent: 'w-[200px] md:w-[300px]' },
      lg: { main: 'w-[300px] md:w-[400px]', accent: 'w-[200px] md:w-[300px]' }
    }

    // Accent color gradients
    const accentGradients = {
      green:
        'linear-gradient(90deg, rgba(34, 197, 94, 0) 0%, rgb(34, 197, 94) 50%, rgba(34, 197, 94, 0) 100%)',
      red: 'linear-gradient(90deg, rgba(239, 68, 68, 0) 0%, rgb(239, 68, 68) 50%, rgba(239, 68, 68, 0) 100%)',
      none: null
    }

    const currentBeamWidth = beamWidths[lightBeamWidth]
    const accentGradient = accentGradients[accentColor]

    return (
      <div
        ref={ref}
        className={cn(glowCardVariants({ variant, size, height, className }))}
        style={{
          background: backgroundStyle[variant || 'default'],
          maskImage: `linear-gradient(rgb(0, 0, 0) 92.5%, rgba(0, 0, 0, 0) 100%)`,
          maskSize: '100% 100%',
          maskPosition: 'center bottom'
        }}
        {...props}
      >
        {/* Main light beams */}
        <div
          className={`absolute top-0 ${currentBeamWidth.main} h-[1px] left-1/2 -translate-x-1/2 pointer-events-none blur-[3px]`}
          style={{
            background:
              'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgb(255, 255, 255) 50%, rgba(255, 255, 255, 0) 100%)'
          }}
        />
        <div
          className={`absolute top-0 ${currentBeamWidth.main} h-[1px] left-1/2 -translate-x-1/2 pointer-events-none blur-[8px]`}
          style={{
            background:
              'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgb(255, 255, 255) 50%, rgba(255, 255, 255, 0) 100%)'
          }}
        />

        {/* Accent light beam */}
        {accentGradient && (
          <div
            className={`absolute top-0 ${currentBeamWidth.accent} h-[1px] left-1/2 -translate-x-1/2 pointer-events-none`}
            style={{
              background: accentGradient
            }}
          />
        )}

        {/* Content wrapper */}
        <div className="relative h-full">{children}</div>
      </div>
    )
  }
)

GlowCard.displayName = 'GlowCard'

export { GlowCard, glowCardVariants }
export type { GlowCardProps }
