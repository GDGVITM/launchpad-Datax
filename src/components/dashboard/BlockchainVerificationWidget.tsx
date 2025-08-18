'use client'

import { useBlockchainVerification } from '@/hooks/useDashboardData'

export default function BlockchainVerificationWidget() {
  const verificationData = useBlockchainVerification()

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">Blockchain Verification</h3>
        <span className="text-2xl">⛓️</span>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-success mb-2">
          {verificationData.percentage}%
        </div>
        <div className="text-sm text-text-muted">Verification Rate</div>
      </div>

      <div className="w-full bg-background rounded-full h-3 mb-4">
        <div 
          className="h-3 bg-success rounded-full transition-all duration-300 flex items-center justify-end pr-1"
          style={{ width: `${verificationData.percentage}%` }}
        >
          {verificationData.percentage > 20 && (
            <span className="text-xs text-white">✓</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-lg font-semibold text-text">{verificationData.total}</div>
          <div className="text-xs text-text-muted">Total</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-success">{verificationData.verified}</div>
          <div className="text-xs text-text-muted">Verified</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-warning">{verificationData.pending}</div>
          <div className="text-xs text-text-muted">Pending</div>
        </div>
      </div>
    </div>
  )
}
