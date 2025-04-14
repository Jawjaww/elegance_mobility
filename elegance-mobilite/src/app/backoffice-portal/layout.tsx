"use server"

import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/layout/AdminHeader"
import { MobileAdminNav } from "@/components/layout/MobileAdminNav"
import { getServerUser } from "@/lib/database/server"
import type { Database } from "@/lib/types/database.types"

type SupabaseRole = Database["auth"]["users"]["Row"]["role"]

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // Cast du rôle pour la vérification de type
  const role = user.role as SupabaseRole

  // Vérifier si l'utilisateur a le rôle admin
  const hasAccess = role === 'app_admin' || role === 'app_super_admin'

  if (!hasAccess) {
    redirect("/unauthorized")
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <AdminHeader />
      <div className="content-container py-6 flex-grow pb-20 md:pb-6 mobile-safe-area">
        {children}
      </div>
      <MobileAdminNav />
    </div>
  )
}
