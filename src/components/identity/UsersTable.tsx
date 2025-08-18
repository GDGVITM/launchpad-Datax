'use client'

import { useState } from 'react'
import { BlockchainUser } from '@/hooks/useIdentityData'
import { useUpdateUser } from '@/hooks/useIdentityData'
import AddUserModal from './AddUserModal'

interface UsersTableProps {
  users: BlockchainUser[]
  loading: boolean
  onRefresh: () => void
}

export default function UsersTable({ users, loading, onRefresh }: UsersTableProps) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const { updateUser, revokeAccess, loading: updateLoading } = useUpdateUser()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success bg-opacity-10 text-success'
      case 'suspended': return 'bg-critical bg-opacity-10 text-critical'
      case 'pending': return 'bg-warning bg-opacity-10 text-warning'
      default: return 'bg-text bg-opacity-10 text-text'
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return 'bg-critical bg-opacity-10 text-critical'
      case 'user': return 'bg-primary bg-opacity-10 text-primary'
      case 'viewer': return 'bg-info bg-opacity-10 text-info'
      case 'auditor': return 'bg-warning bg-opacity-10 text-warning'
      default: return 'bg-text bg-opacity-10 text-text'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // In a real app, you'd show a toast notification
    alert('Address copied to clipboard!')
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    await updateUser(userId, { status: newStatus as BlockchainUser['status'] })
    onRefresh()
  }

  const handleRevokeAccess = async (userId: string) => {
    if (confirm('Are you sure you want to revoke access for this user?')) {
      await revokeAccess(userId)
      onRefresh()
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-muted">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-medium text-text">Blockchain Identity Management</h3>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <span className="mr-2">👤</span>
            Add User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Blockchain Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Access Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text">{user.name}</div>
                        <div className="text-sm text-text-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono text-text bg-background px-2 py-1 rounded">
                        {truncateAddress(user.blockchainAddress)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(user.blockchainAddress)}
                        className="p-1 text-text-muted hover:text-text transition-colors"
                        title="Copy address"
                      >
                        📋
                      </button>
                    </div>
                    <div className="text-xs text-text-muted mt-1">{user.walletProvider}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessLevelColor(user.accessLevel)}`}>
                      {user.accessLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      disabled={updateLoading}
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 ${getStatusColor(user.status)} focus:ring-2 focus:ring-primary`}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                    {formatTimestamp(user.lastActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary bg-opacity-10 text-primary hover:bg-opacity-20 transition-colors">
                      <span className="mr-1">✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleRevokeAccess(user.id)}
                      disabled={updateLoading}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-critical bg-opacity-10 text-critical hover:bg-opacity-20 transition-colors disabled:opacity-50"
                    >
                      <span className="mr-1">🚫</span>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onUserAdded={() => {
          onRefresh()
          setAddModalOpen(false)
        }}
      />
    </>
  )
}
