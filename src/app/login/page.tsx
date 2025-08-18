'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  LockClosedIcon, 
  UserIcon, 
  ShieldCheckIcon,
  WalletIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  const handleWalletConnect = () => {
    console.log('Connecting wallet...')
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

  const itemTransition = {
    duration: 0.5,
    type: "spring" as const,
    stiffness: 100,
    damping: 15
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-primary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-accent/20 to-transparent rounded-full blur-3xl"
        />
        
        {/* Floating particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
            className={`absolute w-2 h-2 bg-primary/30 rounded-full`}
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 12}%`
            }}
          />
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex items-center justify-center min-h-screen p-6"
      >
        <div className="w-full max-w-md">
          {/* Logo/Hero Section */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8"
          >
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
              className="w-20 h-20 mx-auto mb-6 bg-cyber-gradient rounded-2xl shadow-floating flex items-center justify-center"
            >
              <ShieldCheckIcon className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-cyber-gradient bg-clip-text text-transparent mb-2">
              CyberGuard
            </h1>
            <p className="text-text-muted">
              Secure your digital identity with decentralized protection
            </p>
          </motion.div>

          {/* Main Form Card */}
          <GlassCard className="p-8">
            {/* Tab Switcher */}
            <motion.div
              variants={itemVariants}
              className="flex mb-8 p-1 bg-white/10 rounded-2xl"
            >
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  isLogin 
                    ? 'bg-cyber-gradient text-white shadow-cyber' 
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-cyber-gradient text-white shadow-cyber' 
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Sign Up
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {!isLogin && (
                  <motion.div
                    variants={itemVariants}
                    className="relative"
                  >
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200 text-text placeholder-text-muted backdrop-blur-sm"
                    />
                  </motion.div>
                )}

                <motion.div
                  variants={itemVariants}
                  className="relative"
                >
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200 text-text placeholder-text-muted backdrop-blur-sm"
                  />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="relative"
                >
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200 text-text placeholder-text-muted backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </motion.div>

                {!isLogin && (
                  <motion.div
                    variants={itemVariants}
                    className="relative"
                  >
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200 text-text placeholder-text-muted backdrop-blur-sm"
                    />
                  </motion.div>
                )}

                {isLogin && (
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary bg-white/10 border-white/20 rounded focus:ring-primary focus:ring-2"
                      />
                      <span className="text-sm text-text-muted">Remember me</span>
                    </label>
                    <a 
                      href="#" 
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <NeonButton
                    type="submit"
                    variant="primary"
                    className="w-full justify-center py-3"
                  >
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </NeonButton>
                </motion.div>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="flex items-center my-8"
            >
              <div className="flex-1 border-t border-white/20"></div>
              <span className="px-4 text-sm text-text-muted">or</span>
              <div className="flex-1 border-t border-white/20"></div>
            </motion.div>

            {/* Wallet Connection */}
            <motion.div variants={itemVariants}>
              <NeonButton
                onClick={handleWalletConnect}
                variant="secondary"
                className="w-full justify-center py-3"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <WalletIcon className="w-5 h-5 mr-3" />
                </motion.div>
                Connect Wallet
              </NeonButton>
            </motion.div>

            {/* Footer Links */}
            <motion.div
              variants={itemVariants}
              className="mt-8 text-center space-y-2"
            >
              <p className="text-sm text-text-muted">
                By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </GlassCard>

          {/* Features Showcase */}
          <motion.div
            variants={itemVariants}
            className="mt-8 grid grid-cols-3 gap-4 text-center"
          >
            <div className="p-4">
              <div className="w-8 h-8 mx-auto mb-2 bg-success/20 rounded-lg flex items-center justify-center">
                <span className="text-success">🔒</span>
              </div>
              <p className="text-xs text-text-muted">256-bit Encryption</p>
            </div>
            <div className="p-4">
              <div className="w-8 h-8 mx-auto mb-2 bg-info/20 rounded-lg flex items-center justify-center">
                <span className="text-info">🌐</span>
              </div>
              <p className="text-xs text-text-muted">Blockchain Verified</p>
            </div>
            <div className="p-4">
              <div className="w-8 h-8 mx-auto mb-2 bg-warning/20 rounded-lg flex items-center justify-center">
                <span className="text-warning">⚡</span>
              </div>
              <p className="text-xs text-text-muted">Zero Downtime</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
