'use client'

import { memo } from 'react'

interface OrganicBackgroundProps {
  className?: string
}

const OrganicBackground = memo(({ className = '' }: OrganicBackgroundProps) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Primary gradient mesh - top left */}
      <div 
        className="absolute w-[800px] h-[600px] -top-20 -left-40 opacity-30 dark:opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(139, 92, 246, 0.4) 0%, rgba(168, 85, 247, 0.3) 25%, rgba(236, 72, 153, 0.2) 50%, transparent 70%)',
          borderRadius: '40% 60% 70% 30% / 60% 40% 30% 70%',
          filter: 'blur(40px)',
          animation: 'organicFloat 45s ease-in-out infinite, organicMorph 60s ease-in-out infinite'
        }}
      />

      {/* Secondary gradient mesh - center right */}
      <div 
        className="absolute w-[700px] h-[700px] top-1/3 -right-32 opacity-25 dark:opacity-25"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 40% 50%, rgba(59, 130, 246, 0.4) 0%, rgba(99, 102, 241, 0.3) 30%, rgba(139, 92, 246, 0.2) 60%, transparent 80%)',
          borderRadius: '70% 30% 40% 60% / 30% 70% 60% 40%',
          filter: 'blur(60px)',
          animation: 'organicFloat 50s ease-in-out infinite reverse, organicMorph 70s ease-in-out infinite reverse',
          animationDelay: '15s'
        }}
      />

      {/* Tertiary gradient mesh - bottom left */}
      <div 
        className="absolute w-[600px] h-[500px] bottom-10 -left-20 opacity-20 dark:opacity-20"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 60% 50%, rgba(236, 72, 153, 0.4) 0%, rgba(219, 39, 119, 0.3) 25%, rgba(190, 24, 93, 0.2) 50%, transparent 70%)',
          borderRadius: '50% 50% 30% 70% / 40% 60% 70% 30%',
          filter: 'blur(50px)',
          animation: 'organicFloat 40s ease-in-out infinite, organicMorph 55s ease-in-out infinite',
          animationDelay: '25s'
        }}
      />

      {/* Accent gradient - middle left */}
      <div 
        className="absolute w-[500px] h-[400px] top-2/3 -left-16 opacity-15 dark:opacity-15"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 60%, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.2) 40%, transparent 70%)',
          borderRadius: '60% 40% 50% 50% / 70% 30% 50% 50%',
          filter: 'blur(45px)',
          animation: 'organicFloat 35s ease-in-out infinite reverse, organicMorph 65s ease-in-out infinite',
          animationDelay: '10s'
        }}
      />

      {/* Subtle accent - top right */}
      <div 
        className="absolute w-[400px] h-[350px] top-20 -right-16 opacity-18 dark:opacity-18"
        style={{
          background: 'radial-gradient(ellipse 80% 90% at 40% 40%, rgba(168, 85, 247, 0.3) 0%, rgba(147, 51, 234, 0.2) 35%, transparent 65%)',
          borderRadius: '30% 70% 40% 60% / 50% 50% 70% 30%',
          filter: 'blur(35px)',
          animation: 'organicFloat 42s ease-in-out infinite, organicMorph 52s ease-in-out infinite reverse',
          animationDelay: '20s'
        }}
      />

      {/* Light mode additional gradients for better contrast */}
      <div 
        className="absolute w-[600px] h-[400px] top-1/4 left-1/4 opacity-0 dark:opacity-0 light:opacity-8"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(79, 70, 229, 0.2) 0%, rgba(99, 102, 241, 0.15) 30%, rgba(139, 92, 246, 0.1) 60%, transparent 80%)',
          borderRadius: '55% 45% 40% 60% / 45% 55% 40% 60%',
          filter: 'blur(50px)',
          animation: 'organicFloat 38s ease-in-out infinite, organicMorph 58s ease-in-out infinite',
          animationDelay: '12s'
        }}
      />
    </div>
  )
})

OrganicBackground.displayName = 'OrganicBackground'

export { OrganicBackground }