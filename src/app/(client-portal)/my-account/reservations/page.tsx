"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReservationsClient from "./reservations-client";
import { supabase } from "@/lib/database/client";
import {
  canUserAccessClientPortal,
  clientPortalLoginUrl,
} from "@/lib/auth/client-portal-access";
import { useRoleNavigation } from "@/lib/auth/navigation.client";
import { getUserRole } from "@/lib/utils/auth-helpers";

export default function ReservationsPage() {
  const router = useRouter();
  const { redirectToRoleHome } = useRoleNavigation();
  const [user, setUser] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const {
          data: { user: fetchedUser },
        } = await supabase.auth.getUser();

        if (!fetchedUser) {
          router.replace(clientPortalLoginUrl("/my-account/reservations"));
          return;
        }

        if (!canUserAccessClientPortal(fetchedUser)) {
          redirectToRoleHome(getUserRole(fetchedUser));
          return;
        }

        setUser(fetchedUser);
      } catch (err) {
        console.error("Erreur récupération user client-side", err);
        router.replace(clientPortalLoginUrl("/my-account/reservations"));
      } finally {
        setIsChecking(false);
      }
    };
    check();
  }, [router, redirectToRoleHome]);

  if (isChecking || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <ReservationsClient user={user} />;
}
