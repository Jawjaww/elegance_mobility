'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthModal } from "./AuthModal"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/database/client"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams?.get("from")
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Vérifier si l'utilisateur existe toujours dans auth.users
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error || !user) {
            console.log('🔄 Session fantôme détectée - utilisateur supprimé, nettoyage...')
            await supabase.auth.signOut()
            setIsChecking(false)
            return
          }
          
          // L'utilisateur existe vraiment, rediriger
          router.replace('/auth/already-connected?redirect=login')
          return
        }
        setIsChecking(false)
      } catch (error) {
        console.error('Erreur vérification session:', error)
        await supabase.auth.signOut()
        setIsChecking(false)
      }
    }
    
    checkSession()
  }, [router])
  
  const handleClose = () => {
    if (from) {
      router.push('/') // Retour à l'accueil si c'était une redirection
    } else {
      router.back() // Sinon retour à la page précédente
    }
  }

  // Loading minimal et moderne
  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder à votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthModal 
          open={true}
          onClose={handleClose}
          embedded={true}
        />
      </CardContent>
    </Card>
  )
}