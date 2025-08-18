'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  children: React.ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'System Logs', href: '/logs', icon: DocumentTextIcon },
    { name: 'Threats & Alerts', href: '/threats', icon: ShieldExclamationIcon },
    { name: 'Identity Management', href: '/identity', icon: UserGroupIcon },
    { name: 'Audit Reports', href: '/audit', icon: DocumentCheckIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon }
  ]

  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4rem' }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1,
      x: 0
    }
  }

  const itemTransition = {
    duration: 0.5,
    type: "spring" as const,
    stiffness: 100,
    damping: 15
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-primary/5">
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-glass-gradient backdrop-blur-xl shadow-glass px-4 py-3 border-b border-white/20"
        >
          <h1 className="text-xl font-semibold bg-cyber-gradient bg-clip-text text-transparent">CyberGuard</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-glass-100 backdrop-blur-sm border border-white/20 text-text hover:bg-glass-200 transition-all duration-200"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-glass-gradient backdrop-blur-xl border-r border-white/20 shadow-glass z-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-2xl font-bold bg-cyber-gradient bg-clip-text text-transparent">CyberGuard</h1>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-text-muted hover:text-text transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </motion.button>
                </div>
                
                <nav className="space-y-2">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {navigation.map((item, index) => {
                      const isActive = pathname === item.href
                      return (
                        <motion.div
                          key={item.name}
                          variants={itemVariants}
                          transition={{
                            delay: index * 0.1,
                            duration: 0.5,
                            type: "spring",
                            stiffness: 100,
                            damping: 15
                          }}
                          whileHover={{ x: 4 }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                              ${isActive 
                                ? 'bg-cyber-gradient text-white shadow-cyber transform translate-x-2' 
                                : 'text-text-muted hover:text-text hover:bg-glass-100 hover:transform hover:translate-x-1'
                              }
                            `}
                          >
                            <item.icon className={`
                              mr-3 h-5 w-5 transition-colors duration-200
                              ${isActive ? 'text-white' : 'text-text-muted group-hover:text-text'}
                            `} />
                            {item.name}
                          </Link>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop layout */}
      <div className="flex">
        {/* Desktop sidebar */}
        <motion.div
          variants={sidebarVariants}
          animate={isCollapsed ? 'collapsed' : 'expanded'}
          className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-glass-gradient backdrop-blur-xl border-r border-white/20 shadow-glass z-30"
        >
          <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
            {/* Logo section */}
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              {!isCollapsed ? (
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold bg-cyber-gradient bg-clip-text text-transparent"
                >
                  CyberGuard
                </motion.h1>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-8 h-8 bg-cyber-gradient rounded-lg flex items-center justify-center"
                >
                  <UserIcon className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </div>

            {/* Toggle button */}
            <div className="flex justify-end px-3 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-xl bg-glass-100 border border-white/20 text-text-muted hover:text-text hover:bg-glass-200 transition-all duration-200"
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </motion.button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-2">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {navigation.map((item, index) => {
                  const isActive = pathname === item.href
                  return (
                    <motion.div
                      key={item.name}
                      variants={itemVariants}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }}
                      whileHover={{ x: isCollapsed ? 0 : 4 }}
                    >
                      <Link
                        href={item.href}
                        className={`
                          group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative
                          ${isActive 
                            ? 'bg-cyber-gradient text-white shadow-cyber transform translate-x-2' 
                            : 'text-text-muted hover:text-text hover:bg-glass-100 hover:transform hover:translate-x-1'
                          }
                        `}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={`
                          h-5 w-5 transition-colors duration-200 ${isCollapsed ? 'mx-auto' : 'mr-3'}
                          ${isActive ? 'text-white' : 'text-text-muted group-hover:text-text'}
                        `} />
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.name}
                          </motion.span>
                        )}
                        {isActive && (
                          <motion.div
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            </nav>

            {/* Footer */}
            <div className="flex-shrink-0 px-3 pt-4 border-t border-white/10">
              {!isCollapsed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-3 p-3 bg-glass-100 rounded-xl"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyber-gradient rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">Admin User</p>
                    <p className="text-xs text-text-muted">System Administrator</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1 rounded-lg text-text-muted hover:text-text transition-colors"
                  >
                    <BellIcon className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <div className="w-8 h-8 bg-cyber-gradient rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <div className={`flex-1 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
          {children}
        </div>
      </div>
    </div>
  )
}
