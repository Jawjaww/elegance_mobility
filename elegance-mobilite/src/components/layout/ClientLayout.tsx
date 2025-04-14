"use client"

import type { AuthUser } from "@/lib/types/database.types"
import { ClientHeader } from "./ClientHeader"
import ClientMobileNav from "./ClientMobileNav"
import { Footer } from "./footer"

interface ClientLayoutProps {
  children: React.ReactNode
  user: AuthUser
}

export function ClientLayout({ children, user }: ClientLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <ClientHeader user={user} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 mobile-safe-area">
          {children}
        </main>
        <Footer />
      </div>
      <ClientMobileNav user={user} />
    </div>
  )
}