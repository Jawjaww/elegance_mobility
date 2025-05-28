'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "./LoginForm"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultTab?: "login" | "register"
  title?: string
  description?: string
  embedded?: boolean
}

export function AuthModal({
  open,
  onClose,
  onSuccess,
  defaultTab = "login",
  title = "Connexion requise",
  description = "Connectez-vous ou créez un compte pour continuer",
  embedded = false
}: AuthModalProps) {
  const content = (
    <div className="space-y-6">
      <LoginForm />
      
      <div className="text-center space-y-2">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Mot de passe oublié ?
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
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
