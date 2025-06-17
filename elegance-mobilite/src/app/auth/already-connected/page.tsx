'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/database/client"
import { LogOut, ArrowLeft, User } from "lucide-react"

export default function AlreadyConnectedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams?.get("redirect") || "login"
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        // Si pas connecté, rediriger vers la page demandée
        router.replace(`/auth/${redirect}`)
        return
      }
      setUser(session.user)
    }
    getUser()
  }, [router, redirect])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace(`/auth/${redirect}`)
  }

  const handleGoToDashboard = () => {
    const role = user?.raw_app_meta_data?.role
    const appMetadataRole = user?.app_metadata?.role
    console.log('User object:', user)
    console.log('Raw app meta data:', user?.raw_app_meta_data)
    console.log('App metadata:', user?.app_metadata)
    console.log('Role from raw_app_meta_data:', role)
    console.log('Role from app_metadata:', appMetadataRole)
    
    // Essayons les deux endroits
    const actualRole = role || appMetadataRole
    console.log('Actual role to use:', actualRole)
    
    let dashboardPath = "/"
    
    if (actualRole === "app_driver") {
      dashboardPath = "/driver-portal/dashboard"
      console.log('Setting driver path:', dashboardPath)
    } else if (actualRole === "app_customer") {
      dashboardPath = "/my-account"
      console.log('Setting customer path:', dashboardPath)
    } else if (actualRole === "app_admin") {
      dashboardPath = "/backoffice-portal/dashboard"
      console.log('Setting admin path:', dashboardPath)
    } else {
      console.log('No role matched, using default path. Role was:', actualRole)
    }
    
    console.log('Final redirect path:', dashboardPath)
    router.push(dashboardPath)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-semibold">Déjà connecté</h1>
        <p className="text-muted-foreground">
          Vous êtes connecté en tant que{" "}
          <span className="font-medium">{user.email}</span>
        </p>
      </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGoToDashboard}
            className="w-full btn-gradient text-white"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter pour {redirect === 'signup' ? 'créer un compte' : 'se connecter'}
          </Button>
        </CardContent>
      </Card>
  )
}
