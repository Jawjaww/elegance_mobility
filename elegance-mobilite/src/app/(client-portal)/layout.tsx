"use server"

import { ClientLayout } from "@/components/layout"
import { getServerUser } from "@/lib/database/server"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/types/database.types"

type SupabaseRole = Database["auth"]["users"]["Row"]["role"]

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  
  // Si pas d'utilisateur, rediriger vers la page de login
  if (!user) {
    redirect("/login")
  }

  // Cast du rôle pour la vérification de type
  const role = user.role as SupabaseRole
  
  // Vérifier si l'utilisateur a le rôle client ou admin
  const hasAccess = role === 'app_customer' || 
                    role === 'app_admin' || 
                    role === 'app_super_admin'

  if (!hasAccess) {
    redirect("/unauthorized")
  }

  return <ClientLayout user={user}>{children}</ClientLayout>
}
