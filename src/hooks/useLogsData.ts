'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export interface LogEntry {
  id: string
  timestamp: string
  eventType: string
  user: string
  details: string
  status: 'success' | 'warning' | 'error' | 'info'
  blockchainVerified: boolean
  blockchainTxHash?: string
}

export interface LogsFilter {
  eventType: string
  status: string
  search: string
  dateRange: {
    start: string
    end: string
  }
}

export function useLogsData(filter?: Partial<LogsFilter>) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const params: any = {}
        
        if (filter?.eventType && filter.eventType !== 'all') {
          params.eventType = filter.eventType
        }
        if (filter?.status && filter.status !== 'all') {
          params.severity = filter.status
        }
        if (filter?.search) {
          params.search = filter.search
        }
        
        const response = await apiClient.getLogs(params)
        
        if (response.success && response.data) {
          const fetchedLogs = (response.data as any).logs || []
          const mappedLogs: LogEntry[] = fetchedLogs.map((log: any) => ({
            id: log._id || log.id,
            timestamp: log.timestamp || log.createdAt,
            eventType: log.eventType || 'System Event',
            user: log.source || log.user || 'system',
            details: log.message || log.details || 'No details available',
            status: log.severity === 'critical' ? 'error' : 
                   log.severity === 'warning' ? 'warning' : 
                   log.severity === 'info' ? 'info' : 'success',
            blockchainVerified: log.blockchainVerified || false,
            blockchainTxHash: log.blockchainTxHash
          }))
          
          setLogs(mappedLogs)
        } else {
          // Fallback to empty array if no data
          setLogs([])
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error)
        // Fallback to mock data on error
        const mockLogs: LogEntry[] = [
          {
            id: '1',
            timestamp: '2024-01-19T10:45:32Z',
            eventType: 'Authentication',
            user: 'john.doe@company.com',
            details: 'Successful login from IP 192.168.1.105',
            status: 'success',
            blockchainVerified: true,
            blockchainTxHash: '0xa1b2c3d4e5f6789...'
          },
          {
            id: '2',
            timestamp: '2024-01-19T10:42:18Z',
            eventType: 'Data Access',
            user: 'jane.smith@company.com',
            details: 'Accessed sensitive document: financial_report_q4.pdf',
            status: 'info',
            blockchainVerified: true,
            blockchainTxHash: '0xf6e5d4c3b2a1098...'
          },
          {
            id: '3',
            timestamp: '2024-01-19T10:38:45Z',
            eventType: 'Security Event',
            user: 'system',
            details: 'Failed login attempt from IP 203.0.113.42',
            status: 'warning',
            blockchainVerified: false
          }
        ]
        
        let filteredLogs = [...mockLogs]

        if (filter?.eventType && filter.eventType !== 'all') {
          filteredLogs = filteredLogs.filter(log => log.eventType === filter.eventType)
        }

        if (filter?.status && filter.status !== 'all') {
          filteredLogs = filteredLogs.filter(log => log.status === filter.status)
        }

        if (filter?.search) {
          const searchLower = filter.search.toLowerCase()
          filteredLogs = filteredLogs.filter(log => 
            log.user.toLowerCase().includes(searchLower) ||
            log.details.toLowerCase().includes(searchLower) ||
            log.eventType.toLowerCase().includes(searchLower)
          )
        }

        setLogs(filteredLogs)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [filter])

  return { logs, loading }
}

export function useLogEventTypes() {
  return [
    'Authentication',
    'Data Access',
    'Security Event',
    'System Event',
    'Network Event',
    'Compliance Event'
  ]
}

export function useLogStatuses() {
  return [
    { value: 'success', label: 'Success', color: 'text-success' },
    { value: 'info', label: 'Info', color: 'text-info' },
    { value: 'warning', label: 'Warning', color: 'text-warning' },
    { value: 'error', label: 'Error', color: 'text-critical' }
  ]
}
