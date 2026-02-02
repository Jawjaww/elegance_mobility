'use client'

import { ClientHeader } from "./ClientHeader"
import ClientMobileNav from "./ClientMobileNav"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <ClientHeader />
      <main className="flex-1">
        {children}
      </main>
      <ClientMobileNav />
    </div>
  )
}
