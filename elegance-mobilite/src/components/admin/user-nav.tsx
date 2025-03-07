"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase/client"

type UserData = {
  email: string | null
  role: string | null
  name: string | null
  avatar_url: string | null
}

export function UserNav() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData>({
    email: null,
    role: null,
    name: null,
    avatar_url: null,
  })

  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userRole } = await supabase
            .from('users')  // Utiliser la table users correcte
            .select('role')
            .eq('id', user.id)
            .single()

          setUserData({
            email: user.email || null,
            role: userRole?.role || "utilisateur",
            name: user.user_metadata?.full_name || (user.email ? user.email.split("@")[0] : "Utilisateur"),
            avatar_url: user.user_metadata?.avatar_url || null
          })
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error)
      }
    }
    getUserData()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full"
        >
          <Avatar className="h-10 w-10 border-2 border-neutral-800 bg-neutral-900">
            {userData.avatar_url ? (
              <AvatarImage src={userData.avatar_url} />
            ) : null}
            <AvatarFallback className="bg-neutral-900 text-neutral-200">
              {userData.name ? getInitials(userData.name) : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-neutral-900 border-neutral-800" 
        align="end" 
        forceMount
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-neutral-100">
              {userData.role === "admin" ? "Administrateur" : userData.name}
            </p>
            <p className="text-xs text-neutral-400">
              {userData.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-neutral-200 focus:bg-neutral-800 focus:text-neutral-100">
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-neutral-200 focus:bg-neutral-800 focus:text-neutral-100">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-neutral-800" />
        <DropdownMenuItem 
          className="text-red-400 focus:bg-red-900/50 focus:text-red-300"
          onSelect={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
