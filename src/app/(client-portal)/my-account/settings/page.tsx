"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SettingsForm from "./settings-form";
import type { AppUser as User } from "@/lib/types/common.types";
import { getUserRole as getAppRole } from "@/lib/utils/auth-helpers";
import { supabase } from "@/lib/database/client";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ACCOUNT_PAGE } from "@/components/account/accountUi";

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
      <div className="min-h-[40vh] flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={ACCOUNT_PAGE}>
      <AccountPageHeader
        title="Paramètres"
        description="Préférences générales et sécurité du compte"
        backHref="/my-account"
      />
      <SettingsForm user={user as User} initialData={initialData} />
    </div>
  );
}
