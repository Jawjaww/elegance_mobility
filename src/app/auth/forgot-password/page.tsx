'use client'

import { Suspense, useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/database/client"
import { buildPkceSafeAuthRedirectPath } from "@/lib/auth/auth-redirect-origin"
import { supabaseAuthErrorMessage } from "@/lib/utils/supabase-public-config"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  AuthFormShell,
  AuthLoadingSpinner,
} from "@/components/landing/AuthFormShell"
import { LANDING_CTA, LANDING_LINK } from "@/components/landing/landingSurface"

function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!searchParams) return
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam)
      setError(decodedError)
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
    <AuthFormShell
      kicker="Compte"
      title="Réinitialiser votre mot de passe"
      description="Entrez votre adresse email pour recevoir un lien de réinitialisation."
    >
      {message && (
        <div className="mb-4 rounded-lg border border-blue-500/25 bg-blue-500/10 p-3 text-sm text-blue-100">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
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
          className={`w-full ${LANDING_CTA}`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
        </Button>
      </form>
      <div className="mt-6 space-y-2 text-center text-sm text-neutral-400">
        <Link href="/auth/login" className={`block ${LANDING_LINK}`}>
          Retour à la connexion
        </Link>
        <div>
          Pas encore de compte ?{" "}
          <Link href="/auth/signup" className={`font-medium ${LANDING_LINK}`}>
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </AuthFormShell>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthFormShell
          kicker="Compte"
          title="Réinitialiser votre mot de passe"
          description="Chargement…"
        >
          <AuthLoadingSpinner />
        </AuthFormShell>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  )
}
