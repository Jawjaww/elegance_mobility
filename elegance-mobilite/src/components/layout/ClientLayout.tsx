'use client'

import type { User } from "../../lib/types/common.types"
import { ClientHeader } from "./ClientHeader"
import ClientMobileNav from "./ClientMobileNav"

interface ClientLayoutProps {
  user: User
  children: React.ReactNode
}

export function ClientLayout({ user, children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <ClientHeader user={user} />
      <main className="flex-1">
        {children}
      </main>
      <ClientMobileNav user={user} />
    </div>
  )
}