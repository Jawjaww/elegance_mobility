import { Card } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/database/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import {
  User as UserIcon,
  Mail,
  Lock,
  Bell,
  CalendarClock,
  Settings,
  ChevronRight
} from "lucide-react"
import type { User } from "@/lib/types/common.types" // Importer le type User diretcement depuis database.types?

export default async function MyAccount() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  
  // Conversion explicite en type User personnalisé
  const user = supabaseUser as unknown as User
  
  // Redirect handled by layout if not authenticated
  if (!user) {
    return <div>Loading...</div>
  }
  
  // Accès aux propriétés avec le type User personnalisé
  const firstName = user?.first_name || ''
  const lastName = user?.last_name || ''
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : user.email?.split('@')[0] || ''
  
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    return user.email ? user.email.split('@')[0][0].toUpperCase() : "?"
  }
  
  // Soit directement user.user_metadata si c'est là que les données sont actuellement
  const userAvatar = user.avatar_url || user.user_metadata?.avatar_url || null
  
  const menuItems = [
    {
      href: "/my-account/reservations",
      icon: CalendarClock,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "Mes réservations",
      description: "Consultez l'historique et le statut de vos courses"
    },
    {
      href: "/my-account/personal-info",
      icon: UserIcon,
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
      title: "Informations personnelles",
      description: "Nom, téléphone"
    },
    {
      href: "/my-account/email",
      icon: Mail,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      title: "Adresse email",
      description: "Modifier votre email"
    },
    {
      href: "/my-account/password",
      icon: Lock,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      title: "Mot de passe",
      description: "Changer votre mot de passe"
    },
    {
      href: "/my-account/notifications",
      icon: Bell,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      title: "Notifications",
      description: "Gérer vos préférences de notification"
    },
    {
      href: "/my-account/settings",
      icon: Settings,
      bgColor: "bg-pink-100",
      iconColor: "text-pink-600",
      title: "Paramètres",
      description: "Préférences générales"
    }
  ]
  
  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="text-center">
          <Avatar className="h-24 w-24 mx-auto border-4 border-neutral-800 bg-neutral-900 mb-4">
            {userAvatar ? (
              <AvatarImage src={userAvatar} />
            ) : null}
            <AvatarFallback className="bg-neutral-900 text-3xl text-neutral-200">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-neutral-400">{user.email}</p>
        </div>
      </Card>
      
      <div className="grid gap-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="p-4 hover:bg-neutral-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${item.bgColor}`}>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-neutral-400">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}