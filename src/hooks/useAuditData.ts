'use client'

import { useState, useEffect } from 'react'

export interface AuditReport {
  id: string
  title: string
  type: 'compliance' | 'security' | 'access' | 'incident' | 'blockchain'
  date: string
  size: string
  format: 'PDF' | 'CSV' | 'JSON'
  blockchainHash?: string
  isVerified: boolean
  status: 'ready' | 'generating' | 'failed'
  description: string
  category: string
}

// Mock audit reports data
const mockReports: AuditReport[] = [
  {
    id: '1',
    title: 'Q4 2024 Security Compliance Report',
    type: 'compliance',
    date: '2024-01-19T10:00:00Z',
    size: '2.4 MB',
    format: 'PDF',
    blockchainHash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    isVerified: true,
    status: 'ready',
    description: 'Comprehensive security compliance audit for Q4 2024',
    category: 'Quarterly Compliance'
  },
  {
    id: '2',
    title: 'Access Control Audit - January 2024',
    type: 'access',
    date: '2024-01-18T14:30:00Z',
    size: '856 KB',
    format: 'CSV',
    blockchainHash: '0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
    isVerified: true,
    status: 'ready',
    description: 'User access patterns and privilege escalation analysis',
    category: 'Access Management'
  },
  {
    id: '3',
    title: 'Incident Response Summary - Week 3',
    type: 'incident',
    date: '2024-01-17T09:15:00Z',
    size: '1.2 MB',
    format: 'PDF',
    blockchainHash: '0xc3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
    isVerified: true,
    status: 'ready',
    description: 'Detailed analysis of security incidents and response times',
    category: 'Incident Management'
  },
  {
    id: '4',
    title: 'Blockchain Transaction Audit',
    type: 'blockchain',
    date: '2024-01-16T16:45:00Z',
    size: '3.1 MB',
    format: 'JSON',
    blockchainHash: '0xd4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
    isVerified: true,
    status: 'ready',
    description: 'Comprehensive blockchain transaction verification report',
    category: 'Blockchain Audit'
  },
  {
    id: '5',
    title: 'Security Policy Compliance Check',
    type: 'compliance',
    date: '2024-01-15T11:20:00Z',
    size: '987 KB',
    format: 'PDF',
    isVerified: false,
    status: 'generating',
    description: 'Current security policy adherence analysis',
    category: 'Policy Compliance'
  },
  {
    id: '6',
    title: 'Failed Authentication Attempts Report',
    type: 'security',
    date: '2024-01-14T08:30:00Z',
    size: '445 KB',
    format: 'CSV',
    blockchainHash: '0xe5f6789012345678901234567890abcdef1234567890abcdef1234567890',
    isVerified: true,
    status: 'ready',
    description: 'Analysis of failed login attempts and potential threats',
    category: 'Authentication Security'
  }
]

export function useAuditReports(filter?: { type?: string; status?: string; search?: string; dateRange?: { start: string; end: string } }) {
  const [reports, setReports] = useState<AuditReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      let filteredReports = [...mockReports]

      if (filter?.type && filter.type !== 'all') {
        filteredReports = filteredReports.filter(report => report.type === filter.type)
      }

      if (filter?.status && filter.status !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === filter.status)
      }

      if (filter?.search) {
        const searchLower = filter.search.toLowerCase()
        filteredReports = filteredReports.filter(report => 
          report.title.toLowerCase().includes(searchLower) ||
          report.description.toLowerCase().includes(searchLower) ||
          report.category.toLowerCase().includes(searchLower)
        )
      }

      setReports(filteredReports)
      setLoading(false)
    }, 600)
  }, [filter])

  return { reports, loading }
}

export function useDownloadReport() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const downloadReport = async (reportId: string): Promise<boolean> => {
    setDownloading(reportId)
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 2000))
    setDownloading(null)
    return true
  }

  return { downloadReport, downloading }
}

export function useGenerateReport() {
  const [generating, setGenerating] = useState(false)

  const generateReport = async (reportConfig: {
    type: string
    title: string
    dateRange: { start: string; end: string }
    format: string
  }): Promise<boolean> => {
    setGenerating(true)
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000))
    setGenerating(false)
    return true
  }

  return { generateReport, generating }
}

export function useReportTypes() {
  return [
    { value: 'compliance', label: 'Compliance', description: 'Regulatory compliance reports' },
    { value: 'security', label: 'Security', description: 'Security analysis reports' },
    { value: 'access', label: 'Access Control', description: 'User access and permissions' },
    { value: 'incident', label: 'Incident', description: 'Security incident reports' },
    { value: 'blockchain', label: 'Blockchain', description: 'Blockchain transaction audits' }
  ]
}

export function useReportStatuses() {
  return [
    { value: 'ready', label: 'Ready', color: 'bg-success bg-opacity-10 text-success' },
    { value: 'generating', label: 'Generating', color: 'bg-warning bg-opacity-10 text-warning' },
    { value: 'failed', label: 'Failed', color: 'bg-critical bg-opacity-10 text-critical' }
  ]
}
