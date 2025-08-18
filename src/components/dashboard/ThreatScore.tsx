'use client'

import { motion } from 'framer-motion'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { GlassCard } from '@/components/ui/GlassCard'
import { useThreatData } from '@/hooks/useDashboardData'

export default function ThreatScore() {
  const threatData = useThreatData()

  const getScoreColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success'
      case 'medium': return 'text-warning'
      case 'high': return 'text-accent'
      case 'critical': return 'text-critical'
      default: return 'text-text'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '➡️'
    }
  }

  return (
    <GlassCard className="p-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <ShieldCheckIcon className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold text-text">AI Threat Score</h3>
        </div>
        
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="url(#threatGradient)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${threatData.score * 2.51} 251`}
              initial={{ strokeDasharray: "0 251" }}
              animate={{ strokeDasharray: `${threatData.score * 2.51} 251` }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="drop-shadow-sm"
            />
            <defs>
              <linearGradient id="threatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38a169" />
                <stop offset="50%" stopColor="#f6ad55" />
                <stop offset="100%" stopColor="#e53e3e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                className={`text-2xl font-bold ${getScoreColor(threatData.level)}`}
              >
                {threatData.score}
              </motion.div>
              <div className="text-xs text-text-muted flex items-center justify-center space-x-1">
                <span>Security Level</span>
                <span>{getTrendIcon(threatData.trend)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            threatData.level === 'low' ? 'bg-success/20 text-success' :
            threatData.level === 'medium' ? 'bg-warning/20 text-warning' :
            threatData.level === 'high' ? 'bg-accent/20 text-accent' :
            'bg-critical/20 text-critical'
          }`}>
            {threatData.level.toUpperCase()}
          </span>
        </div>
      </div>
    </GlassCard>
  )
}
