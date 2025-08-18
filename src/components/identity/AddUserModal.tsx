'use client'

import { useState } from 'react'
import { useAddUser, useAccessLevels } from '@/hooks/useIdentityData'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserAdded: () => void
}

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    blockchainAddress: '',
    role: '',
    accessLevel: 'user' as const,
    walletProvider: 'MetaMask'
  })

  const { addUser, loading } = useAddUser()
  const accessLevels = useAccessLevels()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = await addUser({
      ...formData,
      status: 'pending'
    })
    
    if (success) {
      onUserAdded()
      onClose()
      setFormData({
        email: '',
        name: '',
        blockchainAddress: '',
        role: '',
        accessLevel: 'user',
        walletProvider: 'MetaMask'
      })
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-card rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-text">Add New User</h3>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text placeholder-text-muted"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text placeholder-text-muted"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="blockchainAddress" className="block text-sm font-medium text-text mb-2">
                  Blockchain Wallet Address
                </label>
                <input
                  type="text"
                  id="blockchainAddress"
                  value={formData.blockchainAddress}
                  onChange={(e) => handleChange('blockchainAddress', e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text placeholder-text-muted"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-text mb-2">
                    Job Title/Role
                  </label>
                  <input
                    type="text"
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    placeholder="e.g., Security Analyst"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text placeholder-text-muted"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="accessLevel" className="block text-sm font-medium text-text mb-2">
                    Access Level
                  </label>
                  <select
                    id="accessLevel"
                    value={formData.accessLevel}
                    onChange={(e) => handleChange('accessLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text"
                  >
                    {accessLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="walletProvider" className="block text-sm font-medium text-text mb-2">
                  Wallet Provider
                </label>
                <select
                  id="walletProvider"
                  value={formData.walletProvider}
                  onChange={(e) => handleChange('walletProvider', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text"
                >
                  <option value="MetaMask">MetaMask</option>
                  <option value="WalletConnect">WalletConnect</option>
                  <option value="Ledger">Ledger</option>
                  <option value="Coinbase">Coinbase Wallet</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Adding User...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
