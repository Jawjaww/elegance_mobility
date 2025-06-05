import { CustomerGuard } from "@/components/auth/RoleGuard"
import { ClientLayout } from "@/components/layout"
import { getServerUser } from "@/lib/database/server"
import { redirect } from "next/navigation"

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  
  // Vérification précoce avant le guard
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <CustomerGuard>
      {/* user est garanti non-null ici grâce à la vérification ci-dessus */}
      <ClientLayout user={user}>
        {children}
      </ClientLayout>
    </CustomerGuard>
  )
}
