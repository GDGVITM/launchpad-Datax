'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface NeonButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  glow?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function NeonButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  glow = true,
  type = 'button'
}: NeonButtonProps) {
  const variants = {
    primary: `
      bg-gradient-to-r from-primary to-gradient-end text-white
      hover:from-gradient-middle hover:to-gradient-end
      shadow-cyber ${glow ? 'hover:shadow-neon' : ''}
    `,
    secondary: `
      bg-glass-100 backdrop-blur-sm border border-white/20 text-primary
      hover:bg-glass-200 hover:border-white/30
    `,
    danger: `
      bg-gradient-to-r from-critical to-red-600 text-white
      hover:from-red-600 hover:to-critical
      shadow-cyber ${glow ? 'hover:shadow-[0_0_20px_rgba(229,62,62,0.3)]' : ''}
    `,
    success: `
      bg-gradient-to-r from-success to-green-600 text-white
      hover:from-green-600 hover:to-success
      shadow-cyber ${glow ? 'hover:shadow-[0_0_20px_rgba(56,161,105,0.3)]' : ''}
    `,
    warning: `
      bg-gradient-to-r from-warning to-orange-500 text-white
      hover:from-orange-500 hover:to-warning
      shadow-cyber ${glow ? 'hover:shadow-[0_0_20px_rgba(246,173,85,0.3)]' : ''}
    `
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-2xl'
  }

  const baseClasses = `
    font-medium transition-all duration-300 transform
    hover:scale-105 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
  `

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.button>
  )
}
