'use client'

import { memo, useState, useCallback, useEffect } from 'react'
import { OrganicBackground } from './organic-background'

interface AnimatedBackdropProps {
  children: React.ReactNode
  className?: string
}

const AnimatedGradient = memo(
  ({ mousePosition }: { mousePosition: { x: number; y: number } }) => (
    <>
      <div
        className="absolute inset-0 opacity-10 dark:opacity-5 transition-opacity duration-1000 ease-out"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 25%, transparent 50%)`
        }}
      />
      <div
        className="absolute inset-0 opacity-0 dark:opacity-5 transition-opacity duration-1000 ease-out"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 25%, transparent 50%)`
        }}
      />
    </>
  )
)
AnimatedGradient.displayName = 'AnimatedGradient'

const AnimatedBackdrop = memo(({ children, className = '' }: AnimatedBackdropProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Throttled mouse tracking for performance
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    // Add throttled mouse tracking
    let animationFrame: number
    const throttledMouseMove = (e: MouseEvent) => {
      if (animationFrame) return
      animationFrame = requestAnimationFrame(() => {
        handleMouseMove(e)
        animationFrame = 0
      })
    }

    window.addEventListener('mousemove', throttledMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [handleMouseMove])

  return (
    <div className={`min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-500 ${className}`}>
      {/* Sophisticated background with theme support */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900 transition-colors duration-500">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] via-transparent to-black/[0.01] dark:from-white/[0.02] dark:via-transparent dark:to-white/[0.01]" />
        {/* Mouse interaction gradient */}
        <AnimatedGradient mousePosition={mousePosition} />
      </div>

      {/* Subtle noise texture */}
      <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 80px 80px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
})

AnimatedBackdrop.displayName = 'AnimatedBackdrop'

export { AnimatedBackdrop }