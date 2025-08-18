'use client'

import { useState, useEffect } from 'react'

export interface BlockchainUser {
  id: string
  email: string
  name: string
  blockchainAddress: string
  role: string
  accessLevel: 'admin' | 'user' | 'viewer' | 'auditor'
  status: 'active' | 'suspended' | 'pending'
  createdAt: string
  lastActive: string
  walletProvider: string
}

// Mock users data
const mockUsers: BlockchainUser[] = [
  {
    id: '1',
    email: 'admin@company.com',
    name: 'John Administrator',
    blockchainAddress: '0x742d35Cc6634C0532925a3b8D0C6464e',
    role: 'System Administrator',
    accessLevel: 'admin',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    lastActive: '2024-01-19T11:30:00Z',
    walletProvider: 'MetaMask'
  },
  {
    id: '2',
    email: 'security.lead@company.com',
    name: 'Sarah Security',
    blockchainAddress: '0x8ba1f109551bD432803012645Hac136c',
    role: 'Security Lead',
    accessLevel: 'admin',
    status: 'active',
    createdAt: '2024-01-16T14:20:00Z',
    lastActive: '2024-01-19T10:45:00Z',
    walletProvider: 'WalletConnect'
  },
  {
    id: '3',
    email: 'analyst1@company.com',
    name: 'Mike Analyst',
    blockchainAddress: '0x95aD61B0a150d79219dCF64E',
    role: 'Security Analyst',
    accessLevel: 'user',
    status: 'active',
    createdAt: '2024-01-17T09:15:00Z',
    lastActive: '2024-01-19T09:20:00Z',
    walletProvider: 'MetaMask'
  },
  {
    id: '4',
    email: 'auditor@company.com',
    name: 'Emma Auditor',
    blockchainAddress: '0x3e66F58749A2e8E1F9BF8',
    role: 'Compliance Auditor',
    accessLevel: 'auditor',
    status: 'active',
    createdAt: '2024-01-18T16:30:00Z',
    lastActive: '2024-01-19T08:15:00Z',
    walletProvider: 'Ledger'
  },
  {
    id: '5',
    email: 'viewer@company.com',
    name: 'Tom Viewer',
    blockchainAddress: '0x4bBb47e2bCd2B7d4e1f3c3F8',
    role: 'Security Viewer',
    accessLevel: 'viewer',
    status: 'suspended',
    createdAt: '2024-01-10T12:00:00Z',
    lastActive: '2024-01-17T15:45:00Z',
    walletProvider: 'MetaMask'
  },
  {
    id: '6',
    email: 'pending@company.com',
    name: 'Alex Pending',
    blockchainAddress: '0x7cCc47e2bCd2B7d4e1f3c3F9',
    role: 'Security Analyst',
    accessLevel: 'user',
    status: 'pending',
    createdAt: '2024-01-19T08:00:00Z',
    lastActive: '2024-01-19T08:00:00Z',
    walletProvider: 'WalletConnect'
  }
]

export function useUsersData(filter?: { role?: string; status?: string; search?: string }) {
  const [users, setUsers] = useState<BlockchainUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      let filteredUsers = [...mockUsers]

      if (filter?.role && filter.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.accessLevel === filter.role)
      }

      if (filter?.status && filter.status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === filter.status)
      }

      if (filter?.search) {
        const searchLower = filter.search.toLowerCase()
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.blockchainAddress.toLowerCase().includes(searchLower) ||
          user.role.toLowerCase().includes(searchLower)
        )
      }

      setUsers(filteredUsers)
      setLoading(false)
    }, 800)
  }, [filter])

  return { users, loading }
}

export function useAddUser() {
  const [loading, setLoading] = useState(false)

  const addUser = async (userData: Omit<BlockchainUser, 'id' | 'createdAt' | 'lastActive'>): Promise<boolean> => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    return true
  }

  return { addUser, loading }
}

export function useUpdateUser() {
  const [loading, setLoading] = useState(false)

  const updateUser = async (userId: string, updates: Partial<BlockchainUser>): Promise<boolean> => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    return true
  }

  const revokeAccess = async (userId: string): Promise<boolean> => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    setLoading(false)
    return true
  }

  return { updateUser, revokeAccess, loading }
}

export function useAccessLevels() {
  return [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'user', label: 'User', description: 'Standard access' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    { value: 'auditor', label: 'Auditor', description: 'Compliance access' }
  ]
}

export function useUserStatuses() {
  return [
    { value: 'active', label: 'Active', color: 'bg-success bg-opacity-10 text-success' },
    { value: 'suspended', label: 'Suspended', color: 'bg-critical bg-opacity-10 text-critical' },
    { value: 'pending', label: 'Pending', color: 'bg-warning bg-opacity-10 text-warning' }
  ]
}
