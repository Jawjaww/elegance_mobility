"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { Header } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, MapPin, Settings, ChevronRight, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black text-white pt-20 pb-12">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="mb-8 text-center">
            <Avatar className="h-24 w-24 mx-auto border-4 border-neutral-800 bg-neutral-900 mb-4">
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} />
              ) : null}
              <AvatarFallback className="bg-neutral-900 text-3xl text-neutral-200">
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-neutral-400">{user?.email}</p>
          </div>
          
          <div className="grid gap-6">
            {/* Section des réservations */}
            <Card 
              className="bg-neutral-900 border-neutral-800 p-6 hover:border-blue-600/30 transition-colors"
              onClick={() => router.push("/my-account/bookings")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <CalendarClock className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium">Mes réservations</h2>
                    <p className="text-sm text-neutral-400">Consultez l'historique de vos trajets</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </div>
            </Card>
            
            {/* Section des adresses favorites */}
            <Card 
              className="bg-neutral-900 border-neutral-800 p-6 hover:border-green-600/30 transition-colors"
              onClick={() => router.push("/my-account/places")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/10">
                    <MapPin className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium">Adresses favorites</h2>
                    <p className="text-sm text-neutral-400">Gérez vos lieux fréquents</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </div>
            </Card>
            
            {/* Section des paramètres */}
            <Card 
              className="bg-neutral-900 border-neutral-800 p-6 hover:border-orange-600/30 transition-colors"
              onClick={() => router.push("/my-account/settings")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-500/10">
                    <Settings className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium">Paramètres du compte</h2>
                    <p className="text-sm text-neutral-400">Modifiez vos informations personnelles</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </div>
            </Card>
          </div>
          
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              className="border-neutral-700 text-white hover:bg-neutral-800"
              onClick={() => router.push("/reservation")}
            >
              Réserver un trajet
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
