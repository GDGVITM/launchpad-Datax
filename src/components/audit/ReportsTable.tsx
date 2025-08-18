'use client'

import { useState } from 'react'
import { AuditReport } from '@/hooks/useAuditData'
import { useDownloadReport } from '@/hooks/useAuditData'

interface ReportsTableProps {
  reports: AuditReport[]
  loading: boolean
  onRefresh: () => void
}

export default function ReportsTable({ reports, loading, onRefresh }: ReportsTableProps) {
  const { downloadReport, downloading } = useDownloadReport()

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'compliance': return 'bg-primary bg-opacity-10 text-primary'
      case 'security': return 'bg-critical bg-opacity-10 text-critical'
      case 'access': return 'bg-warning bg-opacity-10 text-warning'
      case 'incident': return 'bg-accent bg-opacity-10 text-accent'
      case 'blockchain': return 'bg-info bg-opacity-10 text-info'
      default: return 'bg-text bg-opacity-10 text-text'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-success bg-opacity-10 text-success'
      case 'generating': return 'bg-warning bg-opacity-10 text-warning'
      case 'failed': return 'bg-critical bg-opacity-10 text-critical'
      default: return 'bg-text bg-opacity-10 text-text'
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF': return '📄'
      case 'CSV': return '📊'
      case 'JSON': return '📋'
      default: return '📁'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // In a real app, you'd show a toast notification
    alert('Hash copied to clipboard!')
  }

  const handleDownload = async (reportId: string) => {
    const success = await downloadReport(reportId)
    if (success) {
      // In a real app, the file would be downloaded
      alert('Report download started!')
    }
  }

  const openBlockchainExplorer = (hash: string) => {
    // In a real app, this would open the actual blockchain explorer
    window.open(`https://etherscan.io/tx/${hash}`, '_blank')
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-muted">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-text mb-2">No reports found</h3>
          <p className="text-text-muted">Try adjusting your filters or generate a new report</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Report
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Format & Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Blockchain Hash
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-background transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-text">{report.title}</div>
                    <div className="text-sm text-text-muted">{report.description}</div>
                    <div className="text-xs text-text-muted mt-1">{report.category}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                    {report.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                  {formatDate(report.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getFormatIcon(report.format)}</span>
                    <div>
                      <div className="text-sm font-medium text-text">{report.format}</div>
                      <div className="text-sm text-text-muted">{report.size}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {report.blockchainHash ? (
                    <div className="flex items-center space-x-2">
                      {report.isVerified ? (
                        <span className="text-success text-lg" title="Verified on blockchain">
                          ✅
                        </span>
                      ) : (
                        <span className="text-text-muted text-lg" title="Verification pending">
                          ⏳
                        </span>
                      )}
                      <code className="text-xs font-mono text-text bg-background px-2 py-1 rounded">
                        {truncateHash(report.blockchainHash)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(report.blockchainHash!)}
                        className="p-1 text-text-muted hover:text-text transition-colors"
                        title="Copy hash"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => openBlockchainExplorer(report.blockchainHash!)}
                        className="p-1 text-text-muted hover:text-text transition-colors"
                        title="View on blockchain"
                      >
                        🔗
                      </button>
                    </div>
                  ) : (
                    <span className="text-text-muted text-sm">Not verified</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {report.status === 'ready' && (
                    <button
                      onClick={() => handleDownload(report.id)}
                      disabled={downloading === report.id}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary text-white hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                    >
                      <span className="mr-1">📥</span>
                      {downloading === report.id ? 'Downloading...' : 'Download'}
                    </button>
                  )}
                  {report.status === 'generating' && (
                    <span className="inline-flex items-center px-3 py-1 text-xs text-warning">
                      <span className="mr-1">⏳</span>
                      Generating...
                    </span>
                  )}
                  {report.status === 'failed' && (
                    <button className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-accent bg-opacity-10 text-accent hover:bg-opacity-20 transition-colors">
                      <span className="mr-1">🔄</span>
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
