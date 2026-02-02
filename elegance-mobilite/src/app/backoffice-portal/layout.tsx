'use client'

import { AdminHeader } from "@/components/layout/AdminHeader"
import { MobileAdminNav } from "@/components/layout/MobileAdminNav"
import { AuthCheck } from "@/components/auth/AuthCheck"

export default function BackofficePortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
