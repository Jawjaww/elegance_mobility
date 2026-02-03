'use client'

import { useEffect } from 'react'
import { DriverHeader } from "@/components/layout/DriverHeader"
import { AuthCheck } from "@/components/auth/AuthCheck"
import { usePathname } from "next/navigation"
import { usePWA } from "@/hooks/usePWA"

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isStandalone } = usePWA()
  
  // Ne pas appliquer AuthCheck sur la page de login (évite les boucles infinies)
  const isLoginPage = pathname === '/driver-portal/login'
  
  // Enregistrer le Service Worker
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

  return (
    <AuthCheck allowedRoles={['app_driver']} redirectTo="/auth/login?from=driver">
      <div className={`min-h-screen bg-neutral-950 text-white ${isStandalone ? 'standalone-app' : ''}`}>
        <DriverHeader />
        {/* Layout mobile: pas de padding excessif sur mobile */}
        <main className="max-w-lg mx-auto">
          {children}
        </main>
      </div>
    </AuthCheck>
  )
}
