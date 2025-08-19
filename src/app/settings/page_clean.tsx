'use client'

import React from 'react'
import Sidebar from '@/components/layout/Sidebar'

function SettingsPage() {
  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-background via-purple-50/20 to-primary/5 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            System Settings
          </h1>
          <p className="text-lg text-gray-600">Configure your cybersecurity platform preferences</p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  defaultValue="SecureCore Inc."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200">
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Enhance security with 2FA</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input type="checkbox" defaultChecked className="sr-only" />
                  <div className="block bg-primary/20 w-12 h-6 rounded-full"></div>
                  <div className="dot absolute left-1 top-1 bg-primary w-4 h-4 rounded-full transition transform translate-x-6"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                </div>
                <select className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg">
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Alerts</h4>
                  <p className="text-sm text-gray-600">Receive threat notifications via email</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input type="checkbox" defaultChecked className="sr-only" />
                  <div className="block bg-primary/20 w-12 h-6 rounded-full"></div>
                  <div className="dot absolute left-1 top-1 bg-primary w-4 h-4 rounded-full transition transform translate-x-6"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Alerts</h4>
                  <p className="text-sm text-gray-600">Critical alerts via SMS</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only" />
                  <div className="block bg-gray-500/20 w-12 h-6 rounded-full"></div>
                  <div className="dot absolute left-1 top-1 bg-gray-500 w-4 h-4 rounded-full transition"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}

export default SettingsPage
