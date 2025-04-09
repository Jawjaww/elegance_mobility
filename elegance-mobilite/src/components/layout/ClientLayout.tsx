import React from "react"
import ClientMobileNav from '@/components/layout/ClientMobileNav'
import { headers } from "next/headers"

import { ClientHeader } from '@/components/layout/ClientHeader'
import type { AuthUser } from '@/lib/types/auth.types'

interface ClientLayoutProps {
  children: React.ReactNode
  user: AuthUser | null
}

export async function ClientLayout({ children, user }: ClientLayoutProps) {
  const headersList = await headers()
  const pathname = new URL(headersList.get("x-url") || "/", "http://localhost").pathname

  const isProtectedRoute = pathname.startsWith("/backoffice-portal") ||
                          pathname.startsWith("/auth") ||
                          pathname.startsWith("/admin")

  return (
    <>
      {!isProtectedRoute && <ClientHeader user={user} />}
      {children}
      {!isProtectedRoute && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background">
          <ClientMobileNav user={user} />
        </div>
      )}
    </>
  )
}