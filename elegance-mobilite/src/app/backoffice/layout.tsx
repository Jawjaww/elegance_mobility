import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import {
  createServerComponentClient,
  getAuthenticatedUser,
} from "@/lib/auth/server";
import { hasAdminAccess, hasSuperAdminAccess } from "@/lib/types/auth.types";
import { cache } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Mettre en cache la vérification de l'utilisateur
const checkAdminAuthWithCache = cache(async () => {
  try {
    const cookieStore = cookies();
    const user = await getAuthenticatedUser(cookieStore);

    if (!user) {
      console.error("[BACKOFFICE] Utilisateur non authentifié");
      return null;
    }

    // Vérifier l'accès admin en utilisant le rôle natif PostgreSQL
    if (!hasAdminAccess(user.role)) {
      console.error("[BACKOFFICE] Utilisateur non admin:", {
        email: user.email,
        role: user.role
      });
      return null;
    }

    // Déterminer si l'utilisateur est un super admin
    const is_super_admin = hasSuperAdminAccess(user.role);

    return {
      ...user,
      is_admin: true,
      is_super_admin
    };
  } catch (error) {
    console.error("[BACKOFFICE] Erreur vérification admin:", error);
    return null;
  }
});

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await checkAdminAuthWithCache();

  if (!user) {
    return redirect("/auth/admin-login?error=permissions");
  }

  return (
    <AdminDashboardClient user={user} isSuperAdminLevel={user.is_super_admin}>
      {children}
    </AdminDashboardClient>
  );
}
