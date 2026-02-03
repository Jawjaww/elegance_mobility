'use client'

import { useEffect } from 'react'
import { usePathname } from "next/navigation"
import { DriverHeader } from "@/components/layout/DriverHeader"

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/driver-portal/login'
  const isDashboard = pathname === '/driver-portal/dashboard' || pathname === '/driver-portal'

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])

  if (isLoginPage) {
    return <div className="min-h-screen bg-neutral-950">{children}</div>
  }

  if (isDashboard) {
    return <div className="fixed inset-0">{children}</div>
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <DriverHeader />
      <main className="pb-24">{children}</main>
    </div>
  )
}
