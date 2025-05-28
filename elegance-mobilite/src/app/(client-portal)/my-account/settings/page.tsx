import { createServerSupabaseClient } from "@/lib/database/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "./settings-form"
import type { AuthUser } from "@/lib/types/auth.types"
import { getAppRole } from '@/lib/types/common.types'

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || getAppRole(user) !== 'app_customer') {
    redirect('/auth/login')
  }

  // Créer l'objet initialData avec les champs de la base de données
  const initialData = {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
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
        user={user as AuthUser} 
        initialData={initialData}
      />
    </div>
  )
}
