'use client'

import React from 'react'
import Sidebar from '@/components/layout/Sidebar'

function IdentityPage() {
  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-background via-purple-50/20 to-primary/5 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Identity Management
          </h1>
          <p className="text-lg text-gray-600">Manage blockchain-based user identities and access controls</p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                <h3 className="text-2xl font-bold text-blue-600">125</h3>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <h3 className="text-2xl font-bold text-green-600">118</h3>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
                <h3 className="text-2xl font-bold text-purple-600">12</h3>
                <p className="text-sm text-gray-600">Administrators</p>
              </div>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                <h3 className="text-2xl font-bold text-yellow-600">7</h3>
                <p className="text-sm text-gray-600">Pending Approval</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    JD
                  </div>
                  <div>
                    <h4 className="font-medium">John Doe</h4>
                    <p className="text-sm text-gray-600">Administrator</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded-full text-xs">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    SW
                  </div>
                  <div>
                    <h4 className="font-medium">Sarah Wilson</h4>
                    <p className="text-sm text-gray-600">Security Analyst</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded-full text-xs">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}

export default IdentityPage
