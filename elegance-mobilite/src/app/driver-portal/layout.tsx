'use client'

import { useEffect } from 'react'
import { usePathname } from "next/navigation"
import { DriverHeader } from "@/components/layout/DriverHeader"
import { usePWA } from "@/hooks/usePWA"

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/driver-portal/login'
  const isDashboard = pathname === '/driver-portal/dashboard' || pathname === '/driver-portal'

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] SW registered:', reg.scope))
        .catch(err => console.error('[PWA] SW registration failed:', err))
    }
  }, [])

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
