"use client";

import { useRouter } from "next/navigation";
import { AppRole } from "@/lib/types/common.types";

/**
 * Hook de navigation basé sur les rôles (Pure Client-Side)
 * Compatible Tauri — ne dépend plus de redirect() serveur
 */
export function useRoleNavigation() {
  const router = useRouter();

  const redirectToRoleHome = (role: AppRole | string | null | undefined) => {
    switch (role) {
      case "app_super_admin":
      case "app_admin":
        router.push("/backoffice-portal");
        break;
      case "app_driver":
        router.push("/driver-portal/dashboard");
        break;
      case "app_customer":
        router.push("/my-account");
        break;
      default:
        router.push("/auth/login");
    }
  };

  return { redirectToRoleHome };
}
