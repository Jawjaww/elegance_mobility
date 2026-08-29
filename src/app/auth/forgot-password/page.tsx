'use client'

import { Suspense, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/database/client"
import { buildPkceSafeAuthRedirectPath } from "@/lib/auth/auth-redirect-origin"
import { supabaseAuthErrorMessage } from "@/lib/utils/supabase-public-config"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

// Composant qui utilise useSearchParams - doit être dans Suspense
function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const searchParams = useSearchParams()

  // Lire le paramètre d'erreur de l'URL
  useEffect(() => {
    if (!searchParams) return
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam)
      setError(decodedError)
      // Nettoyer l'URL pour éviter de réafficher l'erreur au rechargement
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      // PKCE stores code_verifier on this origin — redirect must match or the email link fails.
      const redirect = buildPkceSafeAuthRedirectPath(
        "/auth/update-password?type=recovery",
      )
      if (redirect.error || !redirect.url) {
        setError(redirect.error ?? "URL de redirection invalide.")
        return
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: redirect.url },
      )

      if (resetError) {
        setError(supabaseAuthErrorMessage(resetError))
      } else {
        setMessage(
          "Un email de réinitialisation a été envoyé. Ouvrez le lien dans ce même navigateur (évitez l'aperçu Outlook/Gmail).",
        )
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
        <CardTitle>Réinitialiser votre mot de passe</CardTitle>
        <CardDescription>
          Entrez votre adresse email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 text-red-900 rounded-lg text-sm font-bold">
            <div className="font-bold text-lg">⚠️ Erreur</div>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
              suppressHydrationWarning
            />
          </div>
          <Button
            className="btn-gradient text-white w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </Button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-primary block"
          >
            Retour à la connexion
          </Link>
          <div className="text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:underline"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Page avec Suspense boundary
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle>Réinitialiser votre mot de passe</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
