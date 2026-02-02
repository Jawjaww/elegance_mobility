import { getServerUser } from "@/lib/database/server"
import { redirect } from "next/navigation"
import SettingsForm from "./settings-form"
import type { User } from '@/lib/types/common.types'
import { getAppRole } from '@/lib/types/common.types'

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const user = await getServerUser()
  
  if (!user || getAppRole(user) !== 'app_customer') {
    redirect("/auth/login?redirectTo=/my-account/settings")
  }

  // Créer l'objet initialData avec les champs des métadonnées utilisateur
  const userMetadata = user.user_metadata || {}
  const initialData = {
    first_name: userMetadata.first_name || "",
    last_name: userMetadata.last_name || "",
    email: user.email || "",
    phone: userMetadata.phone || "",
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Paramètres du compte</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>
      
      <SettingsForm 
        user={user as User} 
        initialData={initialData}
      />
    </div>
  )
}
