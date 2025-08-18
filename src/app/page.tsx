'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ShieldCheckIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  CpuChipIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { NeonButton } from '@/components/ui/NeonButton'
import { GlassCard } from '@/components/ui/GlassCard'

export default function HomePage() {
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
      description: "Advanced machine learning algorithms detect and prevent cyber threats in real-time"
    },
    {
      icon: ChartBarIcon,
      title: "Comprehensive Analytics",
      description: "Deep insights into your security posture with interactive dashboards and reports"
    },
    {
      icon: UserGroupIcon,
      title: "Identity Management",
      description: "Decentralized identity verification and access control for your organization"
    },
    {
      icon: CpuChipIcon,
      title: "Blockchain Security",
      description: "Immutable audit trails and cryptographic verification for maximum security"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CISO, TechCorp",
      content: "CyberGuard has revolutionized our security operations. The AI-powered detection is incredible.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Security Director",
      content: "Best security platform we've ever used. The blockchain integration is seamless.",
      rating: 5
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
        
        {/* Mesh pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-30" />
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
              CyberGuard
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
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
                  Start Free Trial
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </NeonButton>
              </Link>
              <NeonButton variant="secondary" size="lg" className="px-8">
                Watch Demo
              </NeonButton>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              transition={itemTransition}
              className="flex items-center justify-center space-x-8 pt-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-text-muted">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50M+</div>
                <div className="text-sm text-text-muted">Threats Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-text-muted">Organizations</div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
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
                  <p className="text-text-muted">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 lg:px-12 py-20">
          <motion.div
            variants={itemVariants}
            transition={itemTransition}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-text mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-text-muted">
              See what security professionals are saying about CyberGuard
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={itemVariants}
                transition={{...itemTransition, delay: index * 0.1}}
              >
                <GlassCard className="p-8" delay={index * 0.1}>
                  <div className="flex space-x-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <StarIcon key={i} className="w-5 h-5 text-warning fill-current" />
                    ))}
                  </div>
                  <p className="text-text mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-text">{testimonial.name}</div>
                    <div className="text-text-muted">{testimonial.role}</div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 lg:px-12 py-20">
          <GlassCard className="max-w-4xl mx-auto p-12 text-center">
            <motion.div variants={itemVariants} transition={itemTransition}>
              <h2 className="text-4xl lg:text-5xl font-bold text-text mb-6">
                Ready to Secure Your Future?
              </h2>
              <p className="text-xl text-text-muted mb-8">
                Join thousands of organizations protecting their digital assets with CyberGuard
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <NeonButton variant="primary" size="lg" className="px-8">
                    Start Your Free Trial
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </NeonButton>
                </Link>
                <NeonButton variant="secondary" size="lg" className="px-8">
                  Contact Sales
                </NeonButton>
              </div>
            </motion.div>
          </GlassCard>
        </section>

        {/* Footer */}
        <footer className="px-6 lg:px-12 py-12 border-t border-white/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-cyber-gradient rounded-lg shadow-cyber flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-cyber-gradient bg-clip-text text-transparent">
                  CyberGuard
                </span>
              </div>
              <div className="flex space-x-6 text-text-muted">
                <a href="#" className="hover:text-text transition-colors">Privacy</a>
                <a href="#" className="hover:text-text transition-colors">Terms</a>
                <a href="#" className="hover:text-text transition-colors">Support</a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 text-center text-text-muted">
              <p>&copy; 2024 CyberGuard. All rights reserved. Built with next-generation security in mind.</p>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}
