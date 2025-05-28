'use server'

import { DriverGuard } from "@/components/auth/RoleGuard"
import { DriverHeader } from "@/components/layout/DriverHeader"
import { getServerUser } from "@/lib/database/server"
import { redirect } from "next/navigation"

export default async function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  
  // Le guard vérifiera aussi, mais on fait une vérification précoce
  if (!user) {
    redirect("/auth/login?from=driver")
  }
  
  return (
    <DriverGuard>
      <div className="min-h-screen bg-neutral-950 text-white">
        {/* user est garanti non-null ici */}
        <DriverHeader user={user} />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </DriverGuard>
  )
}
