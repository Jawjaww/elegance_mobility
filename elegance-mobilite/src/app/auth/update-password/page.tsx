'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/database/client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/useToast"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // Échanger le code pour une session côté client (meilleure pratique Supabase)
    const checkCode = async () => {
      console.log('🔍 Vérification du code pour update-password (exchangeCodeForSession)')
      console.log('🔍 URL complète:', window.location.href)

      const code = searchParams?.get('code')
      const type = searchParams?.get('type')
      const verified = searchParams?.get('verified')

      console.log('🔍 Code présent:', !!code)
      console.log('🔍 Type:', type)
      console.log('🔍 Verified:', verified)

      // Vérifier d'abord s'il existe déjà une session (flux legacy via verify-email)
      if (verified === 'true' && !code) {
        console.log('🔍 Vérification de session existante (flux legacy)')
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('✅ Session existante trouvée')
          setIsValidSession(true)
          return
        } else {
          console.log('❌ Aucune session trouvée pour flux legacy')
          setError("Session expirée. Veuillez redemander un lien de réinitialisation.")
          return
        }
      }

      if (code && type === 'recovery') {
        try {
          // Échanger le code pour créer une session temporaire permettant updateUser
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('❌ Erreur exchangeCodeForSession:', error)
            setError('Le lien de réinitialisation est invalide ou a expiré. Veuillez redemander un lien.')
            return
          }

          console.log('✅ Session créée via exchangeCodeForSession:', !!data?.session)
          setIsValidSession(true)
        } catch (err) {
          console.error('💥 Erreur lors de l\'échange du code:', err)
          setError('Une erreur est survenue lors de la vérification du lien. Veuillez réessayer.')
        }
      } else {
        console.log('❌ Aucun code de réinitialisation valide trouvé')
        setError("Lien de réinitialisation invalide ou expiré. Veuillez redemander un lien de réinitialisation.")
      }
    }

    checkCode()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation des mots de passe
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    const code = searchParams?.get('code')
    const type = searchParams?.get('type')
    const verified = searchParams?.get('verified')
    
    // Vérifier qu'on a soit un code PKCE, soit une session existante (flux legacy)
    if (!isValidSession && (!code || type !== 'recovery')) {
      setError("Lien de réinitialisation invalide. Veuillez redemander un lien.")
      return
    }

    setIsLoading(true)

    try {
      console.log('🔍 Tentative de mise à jour du mot de passe pour la session actuelle...')
      const { data, error } = await supabase.auth.updateUser({ password })

      if (error) {
        console.error('❌ Erreur updateUser:', error)
        setError(error.message || 'Impossible de mettre à jour le mot de passe.')
      } else {
        toast({
          title: "Mot de passe mis à jour",
          description: "Votre mot de passe a été modifié avec succès.",
        })
        
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe sécurisé
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isValidSession && error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
            {error}
            <div className="mt-2">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                Redemander un lien de réinitialisation
              </Link>
            </div>
          </div>
        )}

        {isValidSession && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Au moins 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Répétez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  suppressHydrationWarning
                />
              </div>

              <Button 
                className="btn-gradient text-white w-full" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? "Mise à jour en cours..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-primary block"
          >
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}