"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SettingsForm from "./settings-form";
import type { AppUser as User } from "@/lib/types/common.types";
import { getUserRole as getAppRole } from "@/lib/utils/auth-helpers";
import { supabase } from "@/lib/database/client";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user || getAppRole(user) !== "app_customer") {
        router.push("/auth/login?redirectTo=/my-account/settings");
        return;
      }

      setUser(user as User);

      // Créer l'objet initialData avec les champs des métadonnées utilisateur
      const userMetadata = user.user_metadata || {};
      setInitialData({
        first_name: userMetadata.first_name || "",
        last_name: userMetadata.last_name || "",
        email: user.email || "",
        phone: userMetadata.phone || "",
      });

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Paramètres du compte</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      <SettingsForm user={user as User} initialData={initialData} />
    </div>
  );
}
