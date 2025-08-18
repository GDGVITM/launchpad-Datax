'use client'

import { useAlerts } from '@/hooks/useDashboardData'

export default function AlertsList() {
  const alerts = useAlerts()

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📋'
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-l-critical bg-critical bg-opacity-5'
      case 'warning': return 'border-l-warning bg-warning bg-opacity-5'
      case 'info': return 'border-l-info bg-info bg-opacity-5'
      default: return 'border-l-text bg-background'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-critical bg-opacity-10 text-critical'
      case 'investigating': return 'bg-warning bg-opacity-10 text-warning'
      case 'resolved': return 'bg-success bg-opacity-10 text-success'
      default: return 'bg-text bg-opacity-10 text-text'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">Recent Alerts</h3>
        <button className="text-sm text-primary hover:text-primary-dark">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <div className="text-2xl mb-2">🛡️</div>
            <div>No active alerts</div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <h4 className="font-medium text-text">{alert.title}</h4>
                  </div>
                  <p className="text-sm text-text-muted mb-2">{alert.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
