'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  animated?: boolean
  delay?: number
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  animated = true,
  delay = 0
}: MetricCardProps) {
  const colorMap = {
    primary: {
      bg: 'from-primary/20 to-gradient-middle/20',
      border: 'border-primary/30',
      text: 'text-primary',
      icon: 'text-primary'
    },
    success: {
      bg: 'from-success/20 to-green-600/20',
      border: 'border-success/30',
      text: 'text-success',
      icon: 'text-success'
    },
    warning: {
      bg: 'from-warning/20 to-orange-500/20',
      border: 'border-warning/30',
      text: 'text-warning',
      icon: 'text-warning'
    },
    danger: {
      bg: 'from-critical/20 to-red-600/20',
      border: 'border-critical/30',
      text: 'text-critical',
      icon: 'text-critical'
    },
    info: {
      bg: 'from-info/20 to-blue-600/20',
      border: 'border-info/30',
      text: 'text-info',
      icon: 'text-info'
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1
    }
  }

  const valueVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1
    }
  }

  const Card = animated ? motion.div : 'div'
  const Value = animated ? motion.div : 'div'

  return (
    <Card
      variants={animated ? cardVariants : undefined}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "visible" : undefined}
      transition={animated ? {
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      } : undefined}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 }
      }}
      className={`
        relative p-6 rounded-2xl bg-gradient-to-br ${colorMap[color].bg}
        backdrop-blur-sm border ${colorMap[color].border}
        shadow-cyber hover:shadow-elevated transition-all duration-300
        cursor-pointer group overflow-hidden
      `}
    >
      {/* Background glow effect */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300
        bg-gradient-to-br ${colorMap[color].bg}
      `} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-text-muted mb-1">{title}</h3>
            <Value
              variants={animated ? valueVariants : undefined}
              initial={animated ? "hidden" : undefined}
              animate={animated ? "visible" : undefined}
              transition={animated ? {
                duration: 0.4,
                delay: delay + 0.2,
                type: "spring",
                stiffness: 150,
                damping: 20
              } : undefined}
              className={`text-3xl font-bold ${colorMap[color].text}`}
            >
              {value}
            </Value>
          </div>
          {icon && (
            <div className={`${colorMap[color].icon} opacity-80 group-hover:opacity-100 transition-opacity`}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-xs text-text-muted">{subtitle}</p>
          )}
          {trend && (
            <div className={`
              flex items-center text-xs font-medium
              ${trend.isPositive ? 'text-success' : 'text-critical'}
            `}>
              <span className="mr-1">
                {trend.isPositive ? '↗' : '↘'}
              </span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
