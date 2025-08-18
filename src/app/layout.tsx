import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CyberSec Pro - Decentralized Cybersecurity Platform',
  description: 'Enterprise-grade decentralized cybersecurity SaaS platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text antialiased`}>
        {children}
      </body>
    </html>
  )
}
