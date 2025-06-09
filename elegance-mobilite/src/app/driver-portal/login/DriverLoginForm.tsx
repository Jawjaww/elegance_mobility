'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/database/client"
import { useToast } from "@/hooks/useToast"
import { type AppRole } from "@/lib/types/common.types"

export function DriverLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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

      // Vérification typée du rôle pour les chauffeurs
      const userRole = (data.user?.app_metadata?.role ?? data.user?.user_metadata?.role) as AppRole
      
      // Seuls les chauffeurs peuvent se connecter ici
      if (userRole !== 'app_driver') {
        await supabase.auth.signOut()
        throw new Error('Accès réservé aux chauffeurs partenaires')
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans votre espace chauffeur",
      })

      // Ajouter un délai pour s'assurer que la session est établie
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirection complète vers le portail chauffeur
      window.location.href = '/driver-portal/dashboard'

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
          placeholder="chauffeur@exemple.com"
          required
          autoComplete="email"
          disabled={isLoading}
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
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Connexion en cours..." : "Se connecter"}
      </Button>
    </form>
  )
}
