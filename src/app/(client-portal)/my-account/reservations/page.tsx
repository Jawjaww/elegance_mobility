"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReservationsClient from "./reservations-client";
import { supabase } from "@/lib/database/client";
import { getUserRole as getAppRole } from "@/lib/utils/auth-helpers";

export default function ReservationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const {
          data: { user: fetchedUser },
        } = await supabase.auth.getUser();
        const role = getAppRole(fetchedUser);
        if (
          !fetchedUser ||
          !["app_customer", "app_admin", "app_super_admin"].includes(role || "")
        ) {
          router.replace("/auth/login?redirectTo=/my-account/reservations");
          return;
        }
        setUser(fetchedUser);
      } catch (err) {
        console.error("Erreur récupération user client-side", err);
        router.replace("/auth/login?redirectTo=/my-account/reservations");
      } finally {
        setIsChecking(false);
      }
    };
    check();
  }, [router]);

  if (isChecking || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <ReservationsClient user={user} />;
}
