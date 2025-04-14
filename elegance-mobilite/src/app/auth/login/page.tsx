"use client"

import { CardContent, CardHeader } from "@/components/ui/card"
import { AuthModal } from "./AuthModal"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get("redirectTo")

  const handleSuccess = () => {
    if (redirectTo) {
      router.push(redirectTo)
    } else {
      router.push("/my-account")
    }
  }

  const handleClose = () => {
    if (redirectTo) {
      router.push('/') // Retour à l'accueil si c'était une redirection
    } else {
      router.back() // Sinon retour à la page précédente
    }
  }

  return (
    <>
      <CardHeader>
        <h1 className="text-2xl font-semibold mb-2">Connexion</h1>
        <p className="text-sm text-neutral-400">
          Entrez vos identifiants pour accéder à votre compte
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <AuthModal 
          open={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
          defaultTab="login"
          title="Connexion"
          description="Entrez vos identifiants pour accéder à votre compte"
          embedded={true}
        />
      </CardContent>
    </>
  )
}