'use client'

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/database/client"
import { useToast } from "@/hooks/useToast"
import { type AppRole } from "@/lib/types/common.types"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const from = searchParams?.get("from")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error("Votre email n'a pas été confirmé. Veuillez vérifier votre boîte de réception.")
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error("Email ou mot de passe incorrect.")
        }
        throw error
      }

      // Vérification typée du rôle
      const userRole = (data.user?.app_metadata?.role ) as AppRole
      
      // Seuls les admins et super admins ne peuvent pas se connecter sur la page login normale
      // Ils doivent utiliser la page login admin
      if ((userRole === 'app_admin' || userRole === 'app_super_admin') && from !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Veuillez utiliser la page de connexion administrateur')
      }

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      })

      // Redirection basée sur le rôle
      let redirectPath = '/my-account'
      if (from) {
        // Vérifier que la redirection est autorisée pour le rôle
        if (
          (from === 'driver' && userRole !== 'app_driver') ||
          (from === 'admin' && !['app_admin', 'app_super_admin'].includes(userRole))
        ) {
          throw new Error('Accès non autorisé pour ce portail')
        }
        redirectPath = from === 'driver' ? '/driver-portal/dashboard' : from === 'admin' ? '/backoffice-portal' : '/my-account'
      }

      router.push(redirectPath)
      router.refresh()

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error?.message || "Une erreur est survenue",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="exemple@email.com"
          required
          autoComplete="email"
          disabled={isLoading}
          suppressHydrationWarning
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={isLoading}
          suppressHydrationWarning
        />
      </div>
      
      <Button className="btn-gradient text-white w-full" type="submit" disabled={isLoading}>
        {isLoading ? "Connexion en cours..." : "Se connecter"}
      </Button>
    </form>
  )
}