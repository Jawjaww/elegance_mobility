'use server'

import { AdminGuard } from "@/components/auth/RoleGuard"
import { AdminHeader } from "@/components/layout/AdminHeader"
import { MobileAdminNav } from "@/components/layout/MobileAdminNav"
import { getServerUser } from "@/lib/database/server"
import { redirect } from "next/navigation"

export default async function BackofficePortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  
  // Vérification précoce avant le guard
  if (!user) {
    redirect("/auth/login?from=admin")
  }
  
  return (
    <AdminGuard>
      <div className="min-h-screen bg-neutral-950 text-white">
        {/* user est garanti non-null ici */}
        <AdminHeader user={user} />
        <MobileAdminNav />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
