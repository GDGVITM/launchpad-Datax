'use client'

interface SeverityBadgeProps {
  severity: 'critical' | 'warning' | 'info'
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'bg-critical bg-opacity-10 text-critical border-critical',
          icon: '🚨',
          label: 'Critical'
        }
      case 'warning':
        return {
          color: 'bg-warning bg-opacity-10 text-warning border-warning',
          icon: '⚠️',
          label: 'Warning'
        }
      case 'info':
        return {
          color: 'bg-info bg-opacity-10 text-info border-info',
          icon: 'ℹ️',
          label: 'Info'
        }
      default:
        return {
          color: 'bg-text bg-opacity-10 text-text border-text',
          icon: '📋',
          label: 'Unknown'
        }
    }
  }

  const config = getSeverityConfig(severity)

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1" aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  )
}
