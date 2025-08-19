'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import Sidebar from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  }

  return (
    <Sidebar>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gradient-to-br from-background via-purple-50/20 to-primary/5 p-6 space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            System Settings
          </h1>
          <p className="text-text/80 text-lg">Configure your cybersecurity platform preferences</p>
        </motion.div>

        {/* General Settings */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex items-center mb-6">
              <CogIcon className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-semibold text-text">General Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  defaultValue="SecureCore Inc."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200 text-text backdrop-blur-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Timezone
                </label>
                <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200 text-text backdrop-blur-sm">
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* API Settings */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex items-center mb-6">
              <KeyIcon className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-semibold text-text">API Configuration</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Primary API Key
                </label>
                <div className="flex">
                  <input
                    type={showApiKey ? "text" : "password"}
                    defaultValue="sk_live_xxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-l-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200 text-text backdrop-blur-sm"
                    readOnly
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-4 py-3 bg-white/10 border border-white/20 border-l-0 rounded-r-xl hover:bg-white/20 transition-colors"
                  >
                    {showApiKey ? <EyeSlashIcon className="w-5 h-5 text-text" /> : <EyeIcon className="w-5 h-5 text-text" />}
                  </button>
                </div>
              </div>
              
              <NeonButton variant="secondary" size="sm">
                Generate New Key
              </NeonButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <NeonButton onClick={handleSave} disabled={loading} size="lg">
            {loading ? 'Saving...' : 'Save Settings'}
          </NeonButton>
        </motion.div>
      </motion.div>
    </Sidebar>
  )
}
