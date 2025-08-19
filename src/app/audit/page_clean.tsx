'use client'

import React from 'react'
import Sidebar from '@/components/layout/Sidebar'

function AuditPage() {
  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/20 to-primary/5 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4">
            Audit Reports
          </h1>
          <p className="text-lg text-gray-600">Track and review security audit activities and compliance</p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-center">
              <h3 className="text-2xl font-bold text-blue-500 mb-2">24</h3>
              <p className="text-gray-600">Total Reports</p>
            </div>
            
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-center">
              <h3 className="text-2xl font-bold text-green-500 mb-2">18</h3>
              <p className="text-gray-600">Completed</p>
            </div>
            
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-center">
              <h3 className="text-2xl font-bold text-yellow-500 mb-2">6</h3>
              <p className="text-gray-600">In Progress</p>
            </div>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Recent Audit Reports</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="font-semibold">Security Assessment Q1 2024</h4>
                  <p className="text-sm text-gray-600">Network security and vulnerability analysis</p>
                  <p className="text-xs text-gray-500">Generated on: Jan 15, 2024</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded-full text-xs">Completed</span>
                  <button className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded text-xs hover:bg-blue-500/30 transition-colors">
                    View Report
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="font-semibold">Compliance Review</h4>
                  <p className="text-sm text-gray-600">GDPR and data protection compliance check</p>
                  <p className="text-xs text-gray-500">Generated on: Jan 10, 2024</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded-full text-xs">Completed</span>
                  <button className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded text-xs hover:bg-blue-500/30 transition-colors">
                    View Report
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="font-semibold">Penetration Testing Report</h4>
                  <p className="text-sm text-gray-600">External security testing and recommendations</p>
                  <p className="text-xs text-gray-500">Started on: Jan 12, 2024</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-full text-xs">In Progress</span>
                  <button className="px-3 py-1 bg-gray-500/20 text-gray-600 rounded text-xs">
                    View Details
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="font-semibold">Infrastructure Audit</h4>
                  <p className="text-sm text-gray-600">Server and network infrastructure review</p>
                  <p className="text-xs text-gray-500">Started on: Jan 08, 2024</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-full text-xs">In Progress</span>
                  <button className="px-3 py-1 bg-gray-500/20 text-gray-600 rounded text-xs">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Audit Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-semibold text-blue-600">Security</h4>
                <p className="text-sm text-gray-600">8 reports</p>
              </div>
              
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <div className="text-2xl mb-2">📋</div>
                <h4 className="font-semibold text-green-600">Compliance</h4>
                <p className="text-sm text-gray-600">6 reports</p>
              </div>
              
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
                <div className="text-2xl mb-2">🏗️</div>
                <h4 className="font-semibold text-purple-600">Infrastructure</h4>
                <p className="text-sm text-gray-600">5 reports</p>
              </div>
              
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold text-orange-600">Penetration</h4>
                <p className="text-sm text-gray-600">5 reports</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
              Generate New Report
            </button>
            <button className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors">
              Export All Reports
            </button>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}

export default AuditPage
