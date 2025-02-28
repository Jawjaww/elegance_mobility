"use client"

import Link from "next/link"
import { UserNav } from "@/components/admin/user-nav"
import { LayoutDashboard } from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = createClient()

  // Vérifie l'authentification
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      redirect("/login")
    }
  })

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/80">
        <div className="container py-3">
          <div className="flex items-center justify-between px-4">
            <h1 className="flex items-center gap-4 text-xl font-semibold text-neutral-100">
              <Link
                href="/admin"
                className="flex items-center gap-2 hover:text-blue-400 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="hidden sm:inline">
                  Dashboard
                </span>
              </Link>
            </h1>
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {/* Conteneur adaptatif avec des marges sur les grands écrans */}
        <div className="mx-auto max-w-[2000px] p-4">
          {/* Grille responsive pour le contenu */}
          <div className="grid gap-4 md:gap-6 lg:gap-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
