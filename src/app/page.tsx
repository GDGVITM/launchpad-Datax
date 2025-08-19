'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  CpuChipIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { NeonButton } from '@/components/ui/NeonButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { apiClient } from '@/lib/api'

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [systemStatus, setSystemStatus] = useState<any>(null)

  useEffect(() => {
    checkApiConnection()
  }, [])

  const checkApiConnection = async () => {
    try {
      const response = await apiClient.getHealthStatus()
      if (response.success) {
        setApiStatus('connected')
        // Also get system status
        const statusResponse = await apiClient.getSystemStatus()
        if (statusResponse.success) {
          setSystemStatus(statusResponse.data)
        }
      } else {
        setApiStatus('disconnected')
      }
    } catch (error) {
      console.error('API connection failed:', error)
      setApiStatus('disconnected')
    }
  }

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connected': return 'text-success'
      case 'disconnected': return 'text-critical'
      default: return 'text-warning'
    }
  }

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'connected': return <CheckIcon className="w-5 h-5" />
      case 'disconnected': return <ExclamationTriangleIcon className="w-5 h-5" />
      default: return <WifiIcon className="w-5 h-5 animate-pulse" />
    }
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
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  }

  const itemTransition = {
    duration: 0.6,
    type: "spring" as const,
    stiffness: 100,
    damping: 15
  }

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 5, 0]
    }
  }

  const floatingTransition = {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  }

  const features = [
    {
      icon: ShieldCheckIcon,
      title: "AI-Powered Threat Detection",
      description: "Advanced machine learning algorithms detect and prevent cyber threats in real-time",
      status: systemStatus?.features?.threatDetection ? 'Active' : 'Loading...'
    },
    {
      icon: ChartBarIcon,
      title: "Comprehensive Analytics",
      description: "Deep insights into your security posture with interactive dashboards and reports",
      status: systemStatus?.features?.logAnchoring ? 'Active' : 'Loading...'
    },
    {
      icon: UserGroupIcon,
      title: "Identity Management",
      description: "Decentralized identity verification and access control for your organization",
      status: systemStatus?.features?.userManagement ? 'Active' : 'Loading...'
    },
    {
      icon: CpuChipIcon,
      title: "Blockchain Security",
      description: "Immutable audit trails and cryptographic verification for maximum security",
      status: systemStatus?.features?.blockchainIntegration ? 'Active' : 'Development'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-primary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-accent/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        {/* Navigation */}
        <motion.nav
          variants={itemVariants}
          transition={itemTransition}
          className="flex items-center justify-between p-6 lg:px-12"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              variants={floatingVariants}
              animate="animate"
              transition={floatingTransition}
              className="w-10 h-10 bg-cyber-gradient rounded-xl shadow-cyber flex items-center justify-center"
            >
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold bg-cyber-gradient bg-clip-text text-transparent">
              CyberSec Pro
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* API Status Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {apiStatus === 'connected' ? 'API Connected' : 
                 apiStatus === 'disconnected' ? 'API Offline' : 'Connecting...'}
              </span>
            </div>
            
            <Link 
              href="/login"
              className="text-text-muted hover:text-text transition-colors"
            >
              Sign In
            </Link>
            <Link href="/login">
              <NeonButton variant="primary" size="sm">
                Get Started
              </NeonButton>
            </Link>
          </div>
        </motion.nav>

        {/* System Status Banner */}
        {systemStatus && (
          <motion.div
            variants={itemVariants}
            transition={itemTransition}
            className="mx-6 lg:mx-12 mb-8"
          >
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-text">System Status: All Systems Operational</span>
                  </div>
                  <div className="text-sm text-text-muted">
                    Environment: {systemStatus.environment} | Version: {systemStatus.version}
                  </div>
                </div>
                <div className="text-sm text-text-muted">
                  Blockchain: {systemStatus.blockchain?.enabled ? 'Enabled' : 'Disabled'} | 
                  Network: {systemStatus.blockchain?.network}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Hero Section */}
        <section className="px-6 lg:px-12 py-20 text-center">
          <motion.div
            variants={itemVariants}
            transition={itemTransition}
            className="max-w-4xl mx-auto space-y-8"
          >
            <motion.h1 
              variants={itemVariants}
              transition={itemTransition}
              className="text-5xl lg:text-7xl font-bold bg-cyber-gradient bg-clip-text text-transparent leading-tight"
            >
              Next-Generation
              <br />
              Cybersecurity Platform
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              transition={itemTransition}
              className="text-xl lg:text-2xl text-text-muted max-w-3xl mx-auto"
            >
              Protect your digital assets with AI-powered threat detection, 
              blockchain-verified security, and real-time monitoring in a 
              decentralized architecture.
            </motion.p>

            <motion.div
              variants={itemVariants}
              transition={itemTransition}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/dashboard">
                <NeonButton variant="primary" size="lg" className="px-8">
                  View Live Dashboard
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </NeonButton>
              </Link>
              <button onClick={checkApiConnection}>
                <NeonButton variant="secondary" size="lg" className="px-8">
                  Test Connection
                </NeonButton>
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section with Live Status */}
        <section className="px-6 lg:px-12 py-20">
          <motion.div
            variants={itemVariants}
            transition={itemTransition}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-text mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Advanced cybersecurity solutions designed for the modern digital landscape
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                transition={{...itemTransition, delay: index * 0.1}}
                custom={index}
              >
                <GlassCard className="p-8 text-center h-full" hover={true} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="w-16 h-16 mx-auto mb-6 bg-cyber-gradient rounded-2xl shadow-cyber flex items-center justify-center"
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-text mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${feature.status === 'Active' ? 'bg-success' : 'bg-warning'}`}></div>
                    <span className="text-sm font-medium text-text">
                      {feature.status}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Live Demo CTA */}
        <section className="px-6 lg:px-12 py-20">
          <GlassCard className="max-w-4xl mx-auto p-12 text-center">
            <motion.div variants={itemVariants} transition={itemTransition}>
              <h2 className="text-4xl lg:text-5xl font-bold text-text mb-6">
                🚀 Hackathon Demo Ready!
              </h2>
              <p className="text-xl text-text-muted mb-8">
                Full-stack cybersecurity platform with live API connections, 
                real-time data, and blockchain integration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <NeonButton variant="primary" size="lg" className="px-8">
                    View Dashboard Demo
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </NeonButton>
                </Link>
                <Link href="/logs">
                  <NeonButton variant="secondary" size="lg" className="px-8">
                    View Logs Demo
                  </NeonButton>
                </Link>
              </div>
              
              {/* API Connection Status */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${apiStatus === 'connected' ? 'bg-success' : 'bg-critical'}`}></div>
                    <span>Backend API: {apiStatus}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span>Database: Connected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span>Frontend: Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </GlassCard>
        </section>
      </motion.div>
    </div>
  )
}
