'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLoginForm } from "./AdminLoginForm"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/database/client"

export default function AdminLoginPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Rediriger vers la page "déjà connecté" au lieu de forcer le dashboard
          // Cela évite les boucles et donne le choix à l'utilisateur
          router.replace('/auth/already-connected?redirect=login')
          return
        }
      } catch (error) {
        console.error('Erreur vérification session:', error)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkSession()
  }, [router])
  
  const handleClose = () => {
    router.push('/') // Retour à l'accueil
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-8">
      <Card className="w-full max-w-[425px]">
        <CardHeader>
          <CardTitle className="text-center text-white">Connexion Administrateur</CardTitle>
          <CardDescription className="text-center text-neutral-300">
            Accès réservé aux administrateurs et super administrateurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AdminLoginForm />
          
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
