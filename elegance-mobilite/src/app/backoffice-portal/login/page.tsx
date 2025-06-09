'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLoginForm } from "./AdminLoginForm"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminLoginPage() {
  const router = useRouter()
  
  const handleClose = () => {
    router.push('/') // Retour à l'accueil
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
