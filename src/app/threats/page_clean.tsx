'use client'

import React from 'react'
import Sidebar from '@/components/layout/Sidebar'

function ThreatsPage() {
  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-background via-red-50/20 to-primary/5 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            Threat Detection
          </h1>
          <p className="text-lg text-gray-600">Monitor and respond to security threats in real-time</p>
        </div>
        
        <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <h2 className="text-xl font-semibold mb-4">Active Threats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="font-semibold text-red-600">Critical Alert</h3>
              <p className="text-sm text-gray-600">Malware detected in network traffic</p>
            </div>
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <h3 className="font-semibold text-orange-600">High Priority</h3>
              <p className="text-sm text-gray-600">Multiple failed login attempts</p>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h3 className="font-semibold text-yellow-600">Medium Risk</h3>
              <p className="text-sm text-gray-600">Suspicious network activity</p>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}

export default ThreatsPage
