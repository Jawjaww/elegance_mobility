'use client'

import { useEffect, useState } from 'react'
import { usePathname } from "next/navigation"
import { DriverHeader } from "@/components/layout/DriverHeader"
import { usePWA } from "@/hooks/usePWA"

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  // Register Service Worker
  useEffect(() => {
    setMounted(true)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] SW registered:', reg.scope))
        .catch(err => console.error('[PWA] SW registration failed:', err))
    }
  }, [])

  // Prevent hydration mismatch - render consistent initial HTML
  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        {children}
      </div>
    )
  }

  const isLoginPage = pathname === '/driver-portal/login'
  const isDashboard = pathname === '/driver-portal/dashboard' || pathname === '/driver-portal'

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        {children}
      </div>
    )
  }

  // Dashboard is full-screen map, no header
  if (isDashboard) {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-white overflow-hidden">
        {children}
      </div>
    )
  }

  // Other pages have header
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <DriverHeader />
      <main className="pb-24">
        {children}
      </main>
    </div>
  )
}
