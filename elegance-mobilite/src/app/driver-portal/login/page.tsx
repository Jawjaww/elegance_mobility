'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DriverLoginForm } from "@/app/driver-portal/login/DriverLoginForm"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/database/client"
import Link from "next/link"

export default function DriverLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Redirection silencieuse vers la page de déconnexion
          router.replace('/auth/already-connected?redirect=login')
          return
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Erreur vérification session:', error)
        setIsLoading(false)
      }
    }
    
    checkSession()
  }, [router])
  
  const handleClose = () => {
    router.push('/') // Retour à l'accueil
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-8">
      <Card className="w-full max-w-[425px]">
        <CardHeader>
          <CardTitle className="text-center text-white">Connexion Chauffeur</CardTitle>
          <CardDescription className="text-center text-neutral-300">
            Accès réservé aux chauffeurs partenaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <DriverLoginForm />
          
          <div className="text-center space-y-2">
            <div className="text-sm text-neutral-400">
              Pas encore chauffeur partenaire ?
            </div>
            <Link
              href="/auth/signup/driver"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Rejoindre notre équipe
            </Link>
          </div>
          
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-neutral-400 hover:text-white"
            >
              Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
