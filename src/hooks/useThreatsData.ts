'use client'

import { useState, useEffect } from 'react'

export interface Threat {
  id: string
  timestamp: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  status: 'active' | 'resolved' | 'investigating'
  description: string
  source: string
  assignedTo?: string
  riskScore: number
}

export interface ThreatAssignment {
  threatId: string
  assignedTo: string
  assignedBy: string
  assignedAt: string
}

// Mock threats data
const mockThreats: Threat[] = [
  {
    id: '1',
    timestamp: '2024-01-19T11:30:00Z',
    type: 'Malware Detection',
    severity: 'critical',
    status: 'active',
    description: 'Suspicious executable detected in user downloads folder',
    source: 'AI Engine - Behavioral Analysis',
    riskScore: 95,
  },
  {
    id: '2',
    timestamp: '2024-01-19T10:45:00Z',
    type: 'Phishing Attempt',
    severity: 'warning',
    status: 'investigating',
    description: 'Suspicious email with credential harvesting links',
    source: 'Email Security Module',
    assignedTo: 'security.team@company.com',
    riskScore: 78,
  },
  {
    id: '3',
    timestamp: '2024-01-19T09:15:00Z',
    type: 'Anomalous Network Traffic',
    severity: 'warning',
    status: 'active',
    description: 'Unusual outbound traffic to unknown IP addresses',
    source: 'Network Monitoring',
    riskScore: 72,
  },
  {
    id: '4',
    timestamp: '2024-01-19T08:30:00Z',
    type: 'Failed Authentication',
    severity: 'info',
    status: 'resolved',
    description: 'Multiple failed login attempts from single IP',
    source: 'Authentication Monitor',
    assignedTo: 'admin@company.com',
    riskScore: 45,
  },
  {
    id: '5',
    timestamp: '2024-01-19T07:20:00Z',
    type: 'Data Exfiltration Attempt',
    severity: 'critical',
    status: 'resolved',
    description: 'Large volume data transfer to external storage',
    source: 'DLP Engine',
    assignedTo: 'security.team@company.com',
    riskScore: 92,
  },
  {
    id: '6',
    timestamp: '2024-01-19T06:45:00Z',
    type: 'Privilege Escalation',
    severity: 'critical',
    status: 'investigating',
    description: 'Unauthorized admin privilege request detected',
    source: 'Identity & Access Monitor',
    assignedTo: 'admin@company.com',
    riskScore: 88,
  }
]

export function useThreatsData(filter?: { severity?: string; status?: string; search?: string }) {
  const [threats, setThreats] = useState<Threat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      let filteredThreats = [...mockThreats]

      if (filter?.severity && filter.severity !== 'all') {
        filteredThreats = filteredThreats.filter(threat => threat.severity === filter.severity)
      }

      if (filter?.status && filter.status !== 'all') {
        filteredThreats = filteredThreats.filter(threat => threat.status === filter.status)
      }

      if (filter?.search) {
        const searchLower = filter.search.toLowerCase()
        filteredThreats = filteredThreats.filter(threat => 
          threat.type.toLowerCase().includes(searchLower) ||
          threat.description.toLowerCase().includes(searchLower) ||
          threat.source.toLowerCase().includes(searchLower)
        )
      }

      setThreats(filteredThreats)
      setLoading(false)
    }, 800)
  }, [filter])

  return { threats, loading }
}

export function useAssignThreat() {
  const [loading, setLoading] = useState(false)

  const assignThreat = async (threatId: string, assignedTo: string): Promise<boolean> => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    return true
  }

  return { assignThreat, loading }
}

export function useThreatTypes() {
  return [
    'Malware Detection',
    'Phishing Attempt',
    'Anomalous Network Traffic',
    'Failed Authentication',
    'Data Exfiltration Attempt',
    'Privilege Escalation',
    'SQL Injection',
    'Cross-Site Scripting',
    'Brute Force Attack'
  ]
}

export function useThreatSeverities() {
  return [
    { value: 'critical', label: 'Critical', color: 'bg-critical bg-opacity-10 text-critical' },
    { value: 'warning', label: 'Warning', color: 'bg-warning bg-opacity-10 text-warning' },
    { value: 'info', label: 'Info', color: 'bg-info bg-opacity-10 text-info' }
  ]
}

export function useThreatStatuses() {
  return [
    { value: 'active', label: 'Active', color: 'bg-critical bg-opacity-10 text-critical' },
    { value: 'investigating', label: 'Investigating', color: 'bg-warning bg-opacity-10 text-warning' },
    { value: 'resolved', label: 'Resolved', color: 'bg-success bg-opacity-10 text-success' }
  ]
}
