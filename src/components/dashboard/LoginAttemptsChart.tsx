'use client'

import { motion } from 'framer-motion'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLoginAttempts } from '@/hooks/useDashboardData'

export default function LoginAttemptsChart() {
  const loginData = useLoginAttempts()

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      default: return '➡️'
    }
  }

  // Transform data for recharts
  const chartData = loginData.chartData.map(item => ({
    ...item,
    total: item.success + item.failed
  }))

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyber-gradient rounded-lg shadow-cyber">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">Login Attempts</h3>
            <p className="text-sm text-text-muted">Authentication tracking</p>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center space-x-2 px-3 py-1 bg-info/20 text-info rounded-full text-sm font-medium"
        >
          <span>{getTrendIcon(loginData.trend)}</span>
          <span>Live</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center p-3 bg-white/5 rounded-xl"
        >
          <div className="text-2xl font-bold text-text">{loginData.total}</div>
          <div className="text-sm text-text-muted">Total</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center p-3 bg-success/10 rounded-xl"
        >
          <div className="text-2xl font-bold text-success">{loginData.success}</div>
          <div className="text-sm text-text-muted">Success</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center p-3 bg-critical/10 rounded-xl"
        >
          <div className="text-2xl font-bold text-critical">{loginData.failed}</div>
          <div className="text-sm text-text-muted">Failed</div>
        </motion.div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38a169" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#38a169" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#e53e3e" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6c757d', fontSize: 12 }}
              tickFormatter={(value) => value.slice(-5)}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6c757d', fontSize: 12 }} 
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#212529'
              }}
            />
            <Area
              type="monotone"
              dataKey="success"
              stackId="1"
              stroke="#38a169"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSuccess)"
            />
            <Area
              type="monotone"
              dataKey="failed"
              stackId="1"
              stroke="#e53e3e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFailed)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
