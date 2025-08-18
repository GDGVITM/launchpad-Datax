'use client'

import { useState, useEffect } from 'react'

// Mock data types
export interface ThreatData {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

export interface LoginAttempts {
  total: number
  failed: number
  success: number
  trend: 'up' | 'down' | 'stable'
  chartData: { date: string; failed: number; success: number }[]
}

export interface TrafficAnomalies {
  detected: number
  resolved: number
  active: number
  chartData: { time: string; anomalies: number }[]
}

export interface BlockchainVerification {
  percentage: number
  total: number
  verified: number
  pending: number
}

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  status: 'active' | 'resolved' | 'investigating'
}

// Mock hooks
export function useThreatData(): ThreatData {
  const [data, setData] = useState<ThreatData>({
    score: 0,
    level: 'low',
    trend: 'stable'
  })

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData({
        score: 78,
        level: 'medium',
        trend: 'down'
      })
    }, 1000)
  }, [])

  return data
}

export function useLoginAttempts(): LoginAttempts {
  const [data, setData] = useState<LoginAttempts>({
    total: 0,
    failed: 0,
    success: 0,
    trend: 'stable',
    chartData: []
  })

  useEffect(() => {
    setTimeout(() => {
      setData({
        total: 1247,
        failed: 23,
        success: 1224,
        trend: 'up',
        chartData: [
          { date: '2024-01-15', failed: 12, success: 156 },
          { date: '2024-01-16', failed: 8, success: 189 },
          { date: '2024-01-17', failed: 15, success: 201 },
          { date: '2024-01-18', failed: 23, success: 178 },
          { date: '2024-01-19', failed: 19, success: 224 },
        ]
      })
    }, 1200)
  }, [])

  return data
}

export function useTrafficAnomalies(): TrafficAnomalies {
  const [data, setData] = useState<TrafficAnomalies>({
    detected: 0,
    resolved: 0,
    active: 0,
    chartData: []
  })

  useEffect(() => {
    setTimeout(() => {
      setData({
        detected: 47,
        resolved: 42,
        active: 5,
        chartData: [
          { time: '00:00', anomalies: 2 },
          { time: '04:00', anomalies: 1 },
          { time: '08:00', anomalies: 5 },
          { time: '12:00', anomalies: 8 },
          { time: '16:00', anomalies: 3 },
          { time: '20:00', anomalies: 7 },
        ]
      })
    }, 800)
  }, [])

  return data
}

export function useBlockchainVerification(): BlockchainVerification {
  const [data, setData] = useState<BlockchainVerification>({
    percentage: 0,
    total: 0,
    verified: 0,
    pending: 0
  })

  useEffect(() => {
    setTimeout(() => {
      setData({
        percentage: 94.7,
        total: 1247,
        verified: 1181,
        pending: 66
      })
    }, 600)
  }, [])

  return data
}

export function useAlerts(): Alert[] {
  const [data, setData] = useState<Alert[]>([])

  useEffect(() => {
    setTimeout(() => {
      setData([
        {
          id: '1',
          type: 'critical',
          title: 'Suspicious Login Activity',
          description: 'Multiple failed login attempts from IP 192.168.1.100',
          timestamp: '2024-01-19T10:30:00Z',
          status: 'active'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Traffic Anomaly Detected',
          description: 'Unusual traffic spike in API endpoint /auth/login',
          timestamp: '2024-01-19T09:15:00Z',
          status: 'investigating'
        },
        {
          id: '3',
          type: 'info',
          title: 'System Update Complete',
          description: 'Security patches have been successfully applied',
          timestamp: '2024-01-19T08:00:00Z',
          status: 'resolved'
        }
      ])
    }, 1500)
  }, [])

  return data
}
