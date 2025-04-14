"use server"

import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/database/server"
import { DriverHeader } from "@/components/layout"
import type { Database } from "@/lib/types/database.types"

type SupabaseRole = Database["auth"]["users"]["Row"]["role"]

export default async function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }

  // Cast du rôle pour la vérification de type
  const role = user.role as SupabaseRole

  // Vérifier si l'utilisateur a le rôle chauffeur
  if (role !== 'app_driver') {
    redirect('/unauthorized')
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-emerald-950 to-neutral-950 text-neutral-100">
      <DriverHeader />
      <main className="flex-1 mobile-safe-area">{children}</main>
    </div>
  )
}

// Opt-out du cache pour toujours vérifier les permissions
export const revalidate = 0

// Force le rendu dynamique
export const dynamic = 'force-dynamic'
