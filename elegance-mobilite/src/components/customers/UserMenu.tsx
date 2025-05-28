"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from '@/lib/database/client'
import type { User } from '@/lib/types/common.types'
import { useToast } from "@/hooks/useToast"

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      setIsOpen(false)
      const { success, error } = await signOut()
      
      if (success) {
        // Utilisation d'une redirection forcée pour s'assurer que la page se recharge
        // et que le contexte d'authentification soit complètement réinitialisé
        window.location.href = '/auth/login'
        // Note: Ici, nous utilisons intentionnellement window.location.href car 
        // nous voulons un rechargement complet après la déconnexion pour réinitialiser l'état
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error || "Impossible de se déconnecter. Veuillez réessayer."
        })
      }
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err)
      toast({
        variant: "destructive",
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors de la déconnexion."
      })
    }
  }

  const isAdminUser = user.role === 'app_admin' || user.role === 'app_super_admin'
  
  // Utiliser first_name et last_name directement
  const fullName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : undefined
    
  const initials = fullName
    ? fullName.split(' ').map((word: string) => word[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() || "U"

  const displayName = fullName || user.email

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-neutral-800 text-neutral-200">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <p className="text-sm font-medium leading-none">{displayName}</p>
        </div>
        <DropdownMenuItem asChild>
          <Link href="/my-account">Mon Compte</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-account/reservations">Mes Réservations</Link>
        </DropdownMenuItem>
        {isAdminUser && (
          <DropdownMenuItem asChild>
            <Link href="/backoffice-portal">Administration</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="cursor-pointer text-red-500 hover:text-red-400 hover:bg-red-950/50"
          onClick={async () => {
            setIsOpen(false)
            await handleLogout()
            // router.refresh() // Forcer un refresh de la page pour déclencher la vérification de session
          }}
        >
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
