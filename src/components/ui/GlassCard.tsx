'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  animate?: boolean
  delay?: number
}

export function GlassCard({ 
  children, 
  className = '', 
  hover = true, 
  animate = true,
  delay = 0 
}: GlassCardProps) {
  const baseClasses = `
    bg-white/10 backdrop-blur-md border border-white/20 
    rounded-2xl shadow-glass transition-all duration-300
  `

  const hoverClasses = hover ? `
    hover:bg-white/15 hover:shadow-elevated hover:scale-[1.02]
    hover:border-white/30 cursor-pointer
  ` : ''

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay,
          type: "spring",
          stiffness: 100,
          damping: 20
        }}
        className={`${baseClasses} ${hoverClasses} ${className}`}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  )
}
