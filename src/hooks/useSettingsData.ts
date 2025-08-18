'use client'

import { useState, useEffect } from 'react'

export interface SettingsData {
  apiKeys: {
    primary: string
    secondary: string
    webhook: string
  }
  notifications: {
    email: boolean
    slack: boolean
    sms: boolean
    webhooks: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    timezone: string
    language: string
    autoRefresh: boolean
    alertThreshold: number
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    ipWhitelist: string[]
  }
}

// Mock settings data
const mockSettings: SettingsData = {
  apiKeys: {
    primary: 'sk_live_1234567890abcdef1234567890abcdef',
    secondary: 'sk_live_abcdef1234567890abcdef1234567890',
    webhook: 'whk_1234567890abcdef1234567890abcdef'
  },
  notifications: {
    email: true,
    slack: true,
    sms: false,
    webhooks: true
  },
  preferences: {
    theme: 'light',
    timezone: 'UTC-8',
    language: 'en',
    autoRefresh: true,
    alertThreshold: 75
  },
  security: {
    twoFactorEnabled: true,
    sessionTimeout: 60,
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8']
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSettings(mockSettings)
      setLoading(false)
    }, 800)
  }, [])

  return { settings, loading, setSettings }
}

export function useSaveSettings() {
  const [saving, setSaving] = useState(false)

  const saveSettings = async (settings: SettingsData): Promise<boolean> => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSaving(false)
    return true
  }

  return { saveSettings, saving }
}

export function useGenerateApiKey() {
  const [generating, setGenerating] = useState(false)

  const generateApiKey = async (keyType: 'primary' | 'secondary' | 'webhook'): Promise<string> => {
    setGenerating(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setGenerating(false)
    
    const prefix = keyType === 'webhook' ? 'whk_' : 'sk_live_'
    const randomSuffix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    return `${prefix}${randomSuffix}`
  }

  return { generateApiKey, generating }
}

export function useTimezones() {
  return [
    { value: 'UTC-12', label: '(UTC-12:00) International Date Line West' },
    { value: 'UTC-11', label: '(UTC-11:00) Coordinated Universal Time-11' },
    { value: 'UTC-10', label: '(UTC-10:00) Hawaii' },
    { value: 'UTC-9', label: '(UTC-09:00) Alaska' },
    { value: 'UTC-8', label: '(UTC-08:00) Pacific Time (US & Canada)' },
    { value: 'UTC-7', label: '(UTC-07:00) Mountain Time (US & Canada)' },
    { value: 'UTC-6', label: '(UTC-06:00) Central Time (US & Canada)' },
    { value: 'UTC-5', label: '(UTC-05:00) Eastern Time (US & Canada)' },
    { value: 'UTC-4', label: '(UTC-04:00) Atlantic Time (Canada)' },
    { value: 'UTC-3', label: '(UTC-03:00) Brazil' },
    { value: 'UTC-2', label: '(UTC-02:00) Coordinated Universal Time-02' },
    { value: 'UTC-1', label: '(UTC-01:00) Azores' },
    { value: 'UTC+0', label: '(UTC+00:00) London, Dublin, Lisbon' },
    { value: 'UTC+1', label: '(UTC+01:00) Berlin, Madrid, Paris' },
    { value: 'UTC+2', label: '(UTC+02:00) Cairo, Helsinki' },
    { value: 'UTC+3', label: '(UTC+03:00) Moscow, Baghdad' },
    { value: 'UTC+4', label: '(UTC+04:00) Abu Dhabi, Muscat' },
    { value: 'UTC+5', label: '(UTC+05:00) Islamabad, Karachi' },
    { value: 'UTC+6', label: '(UTC+06:00) Astana, Dhaka' },
    { value: 'UTC+7', label: '(UTC+07:00) Bangkok, Hanoi' },
    { value: 'UTC+8', label: '(UTC+08:00) Beijing, Singapore' },
    { value: 'UTC+9', label: '(UTC+09:00) Tokyo, Seoul' },
    { value: 'UTC+10', label: '(UTC+10:00) Canberra, Melbourne' },
    { value: 'UTC+11', label: '(UTC+11:00) Magadan, New Caledonia' },
    { value: 'UTC+12', label: '(UTC+12:00) Auckland, Fiji' }
  ]
}
