'use client'

import { motion, useMotionValue, useSpring, type SpringOptions } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  tiltAmount?: number
}

const springConfig: SpringOptions = {
  stiffness: 300,
  damping: 30,
}

export function TiltCard({ 
  children, 
  className = '',
  tiltAmount = 10
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const rotateX = useSpring(0, springConfig)
  const rotateY = useSpring(0, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const rotateXValue = ((e.clientY - centerY) / (rect.height / 2)) * -tiltAmount
    const rotateYValue = ((e.clientX - centerX) / (rect.width / 2)) * tiltAmount
    
    rotateX.set(rotateXValue)
    rotateY.set(rotateYValue)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}