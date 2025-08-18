'use client'

import { useTrafficAnomalies } from '@/hooks/useDashboardData'

export default function TrafficAnomaliesChart() {
  const trafficData = useTrafficAnomalies()

  const maxValue = Math.max(...trafficData.chartData.map(d => d.anomalies))

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <h3 className="text-lg font-semibold text-text mb-4">Traffic Anomalies</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">{trafficData.detected}</div>
          <div className="text-sm text-text-muted">Detected</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success">{trafficData.resolved}</div>
          <div className="text-sm text-text-muted">Resolved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent">{trafficData.active}</div>
          <div className="text-sm text-text-muted">Active</div>
        </div>
      </div>

      {/* Simple Line Chart */}
      <div className="space-y-2">
        <div className="text-xs text-text-muted mb-2">24 Hour Timeline</div>
        <div className="flex items-end space-x-2 h-24">
          {trafficData.chartData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-info rounded-t"
                style={{ height: `${(data.anomalies / maxValue) * 100}%` }}
              />
              <div className="text-xs text-text-muted mt-1">{data.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
