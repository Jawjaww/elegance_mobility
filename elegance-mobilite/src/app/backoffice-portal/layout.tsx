'use client'

import { AdminHeader } from "@/components/layout/AdminHeader"
import { MobileAdminNav } from "@/components/layout/MobileAdminNav"
import { AuthCheck } from "@/components/auth/AuthCheck"
import { usePathname } from "next/navigation"

export default function BackofficePortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Ne pas appliquer AuthCheck sur la page de login (évite les boucles infinies)
  const isLoginPage = pathname === '/backoffice-portal/login'
  
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        {children}
      </div>
    )
  }

  return (
    <AuthCheck allowedRoles={['app_admin', 'app_super_admin']} redirectTo="/backoffice-portal/login">
      <div className="min-h-screen bg-neutral-950 text-white">
        <AdminHeader />
        <MobileAdminNav />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthCheck>
  )
}
