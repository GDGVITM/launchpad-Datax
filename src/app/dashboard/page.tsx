'use client'

import { motion } from 'framer-motion'
import { 
  ShieldCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import Sidebar from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
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

  const itemTransition = {
    duration: 0.5,
    type: "spring" as const,
    stiffness: 100,
    damping: 15
  }

  // Mock data for charts
  const threatData = [
    { name: 'Jan', critical: 4, warning: 12, info: 8 },
    { name: 'Feb', critical: 3, warning: 15, info: 12 },
    { name: 'Mar', critical: 6, warning: 18, info: 15 },
    { name: 'Apr', critical: 2, warning: 22, info: 18 },
    { name: 'May', critical: 5, warning: 19, info: 14 },
    { name: 'Jun', critical: 3, warning: 16, info: 11 }
  ]

  const loginData = [
    { time: '00:00', successful: 120, failed: 5 },
    { time: '04:00', successful: 80, failed: 2 },
    { time: '08:00', successful: 300, failed: 15 },
    { time: '12:00', successful: 450, failed: 8 },
    { time: '16:00', successful: 380, failed: 12 },
    { time: '20:00', successful: 200, failed: 6 }
  ]

  const securityScoreData = [
    { name: 'Excellent', value: 75, color: '#10B981' },
    { name: 'Good', value: 15, color: '#F59E0B' },
    { name: 'Needs Attention', value: 8, color: '#EF4444' },
    { name: 'Critical', value: 2, color: '#DC2626' }
  ]

  const recentAlerts = [
    {
      id: 1,
      type: 'Malware Detected',
      severity: 'critical',
      time: '2 minutes ago',
      description: 'Suspicious executable found in downloads folder',
      source: 'Endpoint Protection'
    },
    {
      id: 2,
      type: 'Failed Login Attempts',
      severity: 'warning',
      time: '15 minutes ago',
      description: 'Multiple failed attempts from IP 192.168.1.100',
      source: 'Access Control'
    },
    {
      id: 3,
      type: 'Policy Violation',
      severity: 'info',
      time: '1 hour ago',
      description: 'Unauthorized software installation attempt',
      source: 'Policy Engine'
    }
  ]

  return (
    <Sidebar>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} transition={itemTransition}>
          <GlassCard className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="p-3 bg-cyber-gradient rounded-2xl shadow-cyber"
                >
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold bg-cyber-gradient bg-clip-text text-transparent">
                    Security Dashboard
                  </h1>
                  <p className="text-xl text-text-muted mt-2">
                    Real-time cybersecurity monitoring and threat intelligence
                  </p>
                </div>
              </div>
              <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-3">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-success/20 text-success border border-success/30"
                >
                  <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></span>
                  All Systems Operational
                </motion.div>
                <NeonButton variant="primary" size="md" className="flex items-center space-x-2">
                  <ChartBarIcon className="w-5 h-5" />
                  <span>Generate Report</span>
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Key Metrics */}
        <motion.section 
          variants={itemVariants}
          transition={itemTransition}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <MetricCard
            title="Security Score"
            value="94"
            icon={<ShieldCheckIcon className="w-6 h-6" />}
            trend={{ value: 5, isPositive: true }}
            color="success"
            suffix="/100"
          />
          
          <MetricCard
            title="Active Threats"
            value="7"
            icon={<ExclamationTriangleIcon className="w-6 h-6" />}
            trend={{ value: 12, isPositive: false }}
            color="danger"
          />
          
          <MetricCard
            title="Protected Assets"
            value="1,247"
            icon={<CpuChipIcon className="w-6 h-6" />}
            trend={{ value: 8, isPositive: true }}
            color="info"
          />
          
          <MetricCard
            title="Active Users"
            value="342"
            icon={<UserGroupIcon className="w-6 h-6" />}
            trend={{ value: 3, isPositive: true }}
            color="primary"
          />
        </motion.section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threat Trends */}
          <motion.div variants={itemVariants} transition={itemTransition}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text">Threat Trends</h3>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-critical/20 text-critical">
                    <span className="w-2 h-2 bg-critical rounded-full mr-1"></span>
                    Critical
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-warning/20 text-warning">
                    <span className="w-2 h-2 bg-warning rounded-full mr-1"></span>
                    Warning
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-info/20 text-info">
                    <span className="w-2 h-2 bg-info rounded-full mr-1"></span>
                    Info
                  </span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={threatData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#8B949E" />
                    <YAxis stroke="#8B949E" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)'
                      }} 
                    />
                    <Bar dataKey="critical" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="warning" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="info" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* Login Analytics */}
          <motion.div variants={itemVariants} transition={itemTransition}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text">Login Analytics</h3>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">
                    <span className="w-2 h-2 bg-success rounded-full mr-1"></span>
                    Successful
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-critical/20 text-critical">
                    <span className="w-2 h-2 bg-critical rounded-full mr-1"></span>
                    Failed
                  </span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loginData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="time" stroke="#8B949E" />
                    <YAxis stroke="#8B949E" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)'
                      }} 
                    />
                    <Line type="monotone" dataKey="successful" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
                    <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security Score Breakdown */}
          <motion.div variants={itemVariants} transition={itemTransition}>
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-text mb-6">Security Score Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={securityScoreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {securityScoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {securityScoreData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-text">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-text">{item.value}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div variants={itemVariants} transition={itemTransition} className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text">Recent Security Alerts</h3>
                <NeonButton variant="secondary" size="sm">
                  View All
                </NeonButton>
              </div>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: alert.id * 0.1 }}
                    className="flex items-start space-x-4 p-4 bg-glass-100 rounded-xl border border-white/20 hover:bg-glass-200 transition-all duration-200"
                  >
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${
                      alert.severity === 'critical' ? 'bg-critical' :
                      alert.severity === 'warning' ? 'bg-warning' : 'bg-info'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text truncate">{alert.type}</p>
                        <p className="text-xs text-text-muted">{alert.time}</p>
                      </div>
                      <p className="text-sm text-text-muted mt-1">{alert.description}</p>
                      <p className="text-xs text-text-muted mt-1">Source: {alert.source}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-shrink-0 p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    >
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} transition={itemTransition}>
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-text mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <NeonButton variant="primary" className="p-4 flex-col space-y-2">
                <ShieldCheckIcon className="w-6 h-6" />
                <span>Run Security Scan</span>
              </NeonButton>
              <NeonButton variant="secondary" className="p-4 flex-col space-y-2">
                <ChartBarIcon className="w-6 h-6" />
                <span>Generate Report</span>
              </NeonButton>
              <NeonButton variant="warning" className="p-4 flex-col space-y-2">
                <ExclamationTriangleIcon className="w-6 h-6" />
                <span>Review Alerts</span>
              </NeonButton>
              <NeonButton variant="success" className="p-4 flex-col space-y-2">
                <UserGroupIcon className="w-6 h-6" />
                <span>Manage Users</span>
              </NeonButton>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </Sidebar>
  )
}
