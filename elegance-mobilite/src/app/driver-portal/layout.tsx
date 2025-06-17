import { DriverGuard } from "@/components/auth/RoleGuard"
import { DriverHeaderWrapper } from "@/components/layout/DriverHeaderWrapper"
import { DriverProvider } from "@/contexts/DriverContext"
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
      <DriverProvider>
        <div className="min-h-screen">
          {/* Header transparent */}
          <DriverHeaderWrapper user={user} />
          
          {/* Main content - plein écran sans padding pour laisser la carte en background */}
          <main className="min-h-screen relative">
            {children}
          </main>
        </div>
      </DriverProvider>
    </DriverGuard>
  )
}
