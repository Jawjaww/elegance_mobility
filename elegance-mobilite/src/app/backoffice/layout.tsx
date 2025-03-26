import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { hasAdminAccess, hasSuperAdminAccess } from "@/lib/types/auth.types";
import { AdminProvider } from "@/lib/contexts/admin.context";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = cookies();
  const user = await getAuthenticatedUser(cookieStore);

  if (!user) {
    console.error("[BACKOFFICE] Utilisateur non authentifié");
    redirect("/auth/login?error=not_authenticated");
  }

  // Vérifier l'accès admin en utilisant le rôle natif PostgreSQL
  if (!hasAdminAccess(user.role)) {
    console.error("[BACKOFFICE] Utilisateur non admin:", {
      email: user.email,
      role: user.role
    });
    redirect("/auth/login?error=insufficient_permissions");
  }

  // Déterminer si l'utilisateur est super admin
  const isSuperAdmin = hasSuperAdminAccess(user.role);

  // En mode développement, afficher les informations d'accès
  if (process.env.NODE_ENV === "development") {
    console.log("[BACKOFFICE] Access granted:", {
      email: user.email,
      role: user.role,
      isSuperAdmin
    });
  }

  return (
    <AdminProvider isSuperAdmin={isSuperAdmin}>
      <AdminDashboardClient 
        user={user} 
        isSuperAdminLevel={isSuperAdmin}
      >
        {children}
      </AdminDashboardClient>
    </AdminProvider>
  );
}

// Empêcher la génération statique
export const dynamic = "force-dynamic";
