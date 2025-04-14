"use server"

import { createServerSupabaseClient } from "@/lib/database/server"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Email ou mot de passe incorrect')
    }
    throw error
  }

  if (!user) {
    throw new Error("Échec de l'authentification")
  }

  // Redirection basée sur le rôle
  switch (user.role) {
    case "app_super_admin":
    case "app_admin":
      redirect("/backoffice-portal")
    case "app_driver":
      redirect("/driver-portal")
    case "app_customer":
      redirect("/my-account")
    default:
      redirect("/unauthorized")
  }
}