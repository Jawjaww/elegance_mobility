import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getServerUser } from "@/lib/database/server";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  ChevronRight,
  Bell
} from "lucide-react";

export default async function ProfilePage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect("/login");
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-4">
      <div className="text-center">
        <Avatar className="h-24 w-24 mx-auto border-4 border-neutral-800 bg-neutral-900 mb-4">
          {user?.user_metadata?.avatar_url ? (
            <AvatarImage src={user.user_metadata.avatar_url} />
          ) : null}
          <AvatarFallback className="bg-neutral-900 text-3xl text-neutral-200">
            {user?.name ? getInitials(user.name) : "U"}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">{user?.name}</h1>
        <p className="text-neutral-400">{user?.email}</p>
      </div>

      <div className="grid gap-4">
        <Link href="/my-account/personal-info">
          <Card className="p-4 hover:bg-neutral-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Informations personnelles</h3>
                  <p className="text-sm text-neutral-500">Nom, téléphone</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
          </Card>
        </Link>

        <Link href="/my-account/email">
          <Card className="p-4 hover:bg-neutral-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Adresse email</h3>
                  <p className="text-sm text-neutral-500">Modifier votre email</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
          </Card>
        </Link>

        <Link href="/my-account/password">
          <Card className="p-4 hover:bg-neutral-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">Mot de passe</h3>
                  <p className="text-sm text-neutral-500">Changer votre mot de passe</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
          </Card>
        </Link>

        <Link href="/my-account/notifications">
          <Card className="p-4 hover:bg-neutral-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-neutral-500">Gérer vos préférences de notification</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
