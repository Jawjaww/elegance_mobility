import { MetricsService } from "@/lib/services/metricsService";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { createServerSupabaseClient } from "@/lib/database/server";
import { redirect } from "next/navigation";
import type { AuthUser } from "@/lib/types/auth.types";

export const revalidate = 0;

/**
 * Page d'accueil du backoffice
 */
export default async function BackofficeIndexPage() {
  const supabase = await createServerSupabaseClient();
  
  // Vérifier si l'utilisateur est connecté et récupérer son rôle
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Le rôle est stocké dans user.role avec les rôles natifs PostgreSQL
  const userRole = user.role as "app_super_admin" | "app_admin" | undefined;
  
  // Vérifier si l'utilisateur a le bon rôle
  if (!userRole || !["app_super_admin", "app_admin"].includes(userRole)) {
    redirect("/");
  }

  // Créer un objet AuthUser correctement typé
  const authUser: AuthUser = {
    id: user.id,
    email: user.email!,
    role: userRole,
    name: user.user_metadata.name || user.email!,
    user_metadata: user.user_metadata
  };

  const metrics = await MetricsService.getDashboardMetrics();

  return (
    <div className="container mx-auto py-8">
      <AdminDashboardClient
        initialMetrics={metrics}
        user={authUser}
        isAdmin={true}
      />
    </div>
  );
}
