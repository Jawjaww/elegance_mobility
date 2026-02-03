'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DriverLoginForm } from "@/app/driver-portal/login/DriverLoginForm"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/database/client"
import { getUserRole } from "@/lib/utils/auth-helpers"
import Link from "next/link"

export default function DriverLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const hasChecked = useRef(false)
  
  useEffect(() => {
    // Éviter les redirections multiples
    if (hasChecked.current) return
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && !hasChecked.current) {
          hasChecked.current = true
          
          // Vérifier si c'est un driver pour rediriger directement
          const role = getUserRole(session.user)
          if (role === 'app_driver') {
            router.replace('/driver-portal/dashboard')
          } else {
            // Pas un driver - rediriger vers la page déjà connecté
            router.replace('/auth/already-connected?redirect=login')
          }
          return
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Erreur vérification session:', error)
        setIsLoading(false)
      }
    }
    
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
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
