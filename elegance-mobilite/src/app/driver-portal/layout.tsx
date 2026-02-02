'use client'

import { DriverHeader } from "@/components/layout/DriverHeader"
import { AuthCheck } from "@/components/auth/AuthCheck"

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
