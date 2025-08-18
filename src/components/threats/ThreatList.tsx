'use client'

import { useState } from 'react'
import { Threat } from '@/hooks/useThreatsData'
import SeverityBadge from './SeverityBadge'
import AssignModal from './AssignModal'

interface ThreatListProps {
  threats: Threat[]
  loading: boolean
  onRefresh: () => void
}

export default function ThreatList({ threats, loading, onRefresh }: ThreatListProps) {
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null)

  const handleAssign = (threat: Threat) => {
    setSelectedThreat(threat)
    setAssignModalOpen(true)
  }

  const handleAssigned = () => {
    onRefresh()
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

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-muted">Loading threats...</p>
        </div>
      </div>
    )
  }

  if (threats.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🛡️</div>
          <h3 className="text-lg font-medium text-text mb-2">No threats found</h3>
          <p className="text-text-muted">Your system is secure or try adjusting your filters</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {threats.map((threat) => (
                <tr key={threat.id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                    {formatTimestamp(threat.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary bg-opacity-10 text-primary">
                      {threat.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SeverityBadge severity={threat.severity} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(threat.status)}`}>
                      {threat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text max-w-xs">
                    <div className="truncate" title={threat.description}>
                      {threat.description}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Source: {threat.source}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-background rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            threat.riskScore >= 80 ? 'bg-critical' :
                            threat.riskScore >= 60 ? 'bg-warning' :
                            'bg-success'
                          }`}
                          style={{ width: `${threat.riskScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-text">{threat.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {!threat.assignedTo && threat.status === 'active' && (
                      <button
                        onClick={() => handleAssign(threat)}
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-accent text-white hover:bg-opacity-90 transition-colors"
                      >
                        <span className="mr-1">👤</span>
                        Assign
                      </button>
                    )}
                    {threat.assignedTo && (
                      <span className="text-xs text-text-muted">
                        Assigned to: {threat.assignedTo}
                      </span>
                    )}
                    <button className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary bg-opacity-10 text-primary hover:bg-opacity-20 transition-colors">
                      <span className="mr-1">👁️</span>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedThreat && (
        <AssignModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false)
            setSelectedThreat(null)
          }}
          threatId={selectedThreat.id}
          threatType={selectedThreat.type}
          onAssigned={handleAssigned}
        />
      )}
    </>
  )
}
