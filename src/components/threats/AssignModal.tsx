'use client'

import { useState } from 'react'
import { useAssignThreat } from '@/hooks/useThreatsData'

interface AssignModalProps {
  isOpen: boolean
  onClose: () => void
  threatId: string
  threatType: string
  onAssigned: () => void
}

export default function AssignModal({ isOpen, onClose, threatId, threatType, onAssigned }: AssignModalProps) {
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState('normal')
  const { assignThreat, loading } = useAssignThreat()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignedTo.trim()) return

    const success = await assignThreat(threatId, assignedTo)
    if (success) {
      onAssigned()
      onClose()
      setAssignedTo('')
      setPriority('normal')
    }
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text">Assign Threat</h3>
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

            <div className="mb-4 p-3 bg-background rounded-lg">
              <p className="text-sm text-text-muted">Threat Type</p>
              <p className="font-medium text-text">{threatType}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-text mb-2">
                  Assign To
                </label>
                <input
                  type="email"
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="security.team@company.com"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text placeholder-text-muted"
                  required
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-text mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !assignedTo.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Assigning...' : 'Assign Threat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
