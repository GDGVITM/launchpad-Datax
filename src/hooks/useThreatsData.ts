'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

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

export function useThreatsData(filter?: { severity?: string; status?: string; search?: string }) {
  const [threats, setThreats] = useState<Threat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchThreats = async () => {
      setLoading(true)
      try {
        const params: any = {}
        
        if (filter?.severity && filter.severity !== 'all') {
          params.severity = filter.severity
        }
        if (filter?.status && filter.status !== 'all') {
          params.status = filter.status
        }
        if (filter?.search) {
          params.search = filter.search
        }
        
        const response = await apiClient.getThreats(params)
        
        if (response.success && response.data) {
          const fetchedThreats = (response.data as any).threats || []
          const mappedThreats: Threat[] = fetchedThreats.map((threat: any) => ({
            id: threat._id || threat.id,
            timestamp: threat.timestamp || threat.createdAt,
            type: threat.threatType || threat.type || 'Unknown Threat',
            severity: threat.severity === 'high' ? 'critical' : threat.severity || 'info',
            status: threat.status || 'active',
            description: threat.description || threat.details || 'No description available',
            source: threat.source || 'System Detection',
            assignedTo: threat.assignedTo,
            riskScore: threat.riskScore || Math.floor(Math.random() * 100)
          }))
          
          setThreats(mappedThreats)
        } else {
          setThreats([])
        }
      } catch (error) {
        console.error('Failed to fetch threats:', error)
        // Fallback to mock data on error
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
          }
        ]
        
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
      } finally {
        setLoading(false)
      }
    }

    fetchThreats()
  }, [filter])

  return { threats, loading }
}

export function useAssignThreat() {
  const [loading, setLoading] = useState(false)

  const assignThreat = async (threatId: string, assignedTo: string): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await apiClient.updateThreatStatus(threatId, 'investigating', `Assigned to ${assignedTo}`)
      setLoading(false)
      return response.success
    } catch (error) {
      console.error('Failed to assign threat:', error)
      setLoading(false)
      return false
    }
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
