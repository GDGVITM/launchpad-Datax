'use client'

import { useState, useEffect } from 'react'

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

// Mock logs data
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
  },
  {
    id: '4',
    timestamp: '2024-01-19T10:35:12Z',
    eventType: 'System Event',
    user: 'admin',
    details: 'Security policy updated: password complexity requirements',
    status: 'success',
    blockchainVerified: true,
    blockchainTxHash: '0x9876543210abcdef...'
  },
  {
    id: '5',
    timestamp: '2024-01-19T10:30:07Z',
    eventType: 'Authentication',
    user: 'bob.wilson@company.com',
    details: 'Account locked due to multiple failed login attempts',
    status: 'error',
    blockchainVerified: true,
    blockchainTxHash: '0xabcdef1234567890...'
  },
  {
    id: '6',
    timestamp: '2024-01-19T10:25:33Z',
    eventType: 'Data Access',
    user: 'alice.brown@company.com',
    details: 'Downloaded customer database backup',
    status: 'info',
    blockchainVerified: false
  },
  {
    id: '7',
    timestamp: '2024-01-19T10:20:15Z',
    eventType: 'Security Event',
    user: 'system',
    details: 'Intrusion detection system triggered by suspicious network activity',
    status: 'warning',
    blockchainVerified: true,
    blockchainTxHash: '0x1122334455667788...'
  },
  {
    id: '8',
    timestamp: '2024-01-19T10:15:42Z',
    eventType: 'System Event',
    user: 'admin',
    details: 'Backup completed successfully',
    status: 'success',
    blockchainVerified: true,
    blockchainTxHash: '0x8877665544332211...'
  }
]

export function useLogsData(filter?: Partial<LogsFilter>) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call with delay
    setLoading(true)
    setTimeout(() => {
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
      setLoading(false)
    }, 800)
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
