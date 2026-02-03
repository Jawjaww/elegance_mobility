'use client'

import { DriverHeader } from "@/components/layout/DriverHeader"
import { AuthCheck } from "@/components/auth/AuthCheck"
import { usePathname } from "next/navigation"

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Ne pas appliquer AuthCheck sur la page de login (évite les boucles infinies)
  const isLoginPage = pathname === '/driver-portal/login'
  
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        {children}
      </div>
    )
  }

  return (
    <AuthCheck allowedRoles={['app_driver']} redirectTo="/auth/login?from=driver">
      <div className="min-h-screen bg-neutral-950 text-white">
        <DriverHeader />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthCheck>
  )
}
