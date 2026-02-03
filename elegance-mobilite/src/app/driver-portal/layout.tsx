'use client'

import { usePathname } from 'next/navigation'
import { DriverHeader } from '@/components/layout/DriverHeader'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname === '/driver-portal' || pathname === '/driver-portal/dashboard'
  const isLogin = pathname === '/driver-portal/login'

  // Dashboard gère son propre layout
  if (isDashboard) return children
  
  // Login sans header
  if (isLogin) return <div className="min-h-screen bg-neutral-950">{children}</div>

  // Autres pages avec header
  return (
    <div className="min-h-screen bg-neutral-950 pb-20">
      <DriverHeader />
      {children}
    </div>
  )
}
