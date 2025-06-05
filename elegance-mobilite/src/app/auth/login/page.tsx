'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthModal } from "./AuthModal"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams?.get("from")
  
  const handleClose = () => {
    if (from) {
      router.push('/') // Retour à l'accueil si c'était une redirection
    } else {
      router.back() // Sinon retour à la page précédente
    }
  }

  return (
    // <div className="container flex items-center justify-center min-h-[600px] py-8">
      <Card className="w-full max-w-[425px]">
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
    // </div>
  )
}