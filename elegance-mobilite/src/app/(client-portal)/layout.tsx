'use client'

import { ClientLayout } from "@/components/layout"
import { AuthCheck } from "@/components/auth/AuthCheck"

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthCheck allowedRoles={['app_customer', 'app_admin', 'app_super_admin']} redirectTo="/auth/login">
      <ClientLayout>
        {children}
      </ClientLayout>
    </AuthCheck>
  )
}
