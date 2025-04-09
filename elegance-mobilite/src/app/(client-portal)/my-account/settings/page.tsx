import { getServerUser } from "@/lib/database/server";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";
import { AuthUser } from "@/lib/types/auth.types";

export default async function SettingsPage() {
  const serverUser = await getServerUser();

  if (!serverUser?.email) {
    redirect("/login");
  }

  // Conversion en AuthUser complet
  const user: AuthUser = {
    id: serverUser.id,
    email: serverUser.email,
    role: serverUser.role as any, // À adapter selon votre type UserRole
    name: serverUser.user_metadata?.name || "",
    user_metadata: {
      phone: serverUser.user_metadata?.phone || "",
      avatar_url: serverUser.user_metadata?.avatar_url || "",
      name: serverUser.user_metadata?.name || "",
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Paramètres du compte</h3>
        <p className="text-sm text-muted-foreground">
          Mettez à jour vos informations personnelles.
        </p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}

export const dynamic = "force-dynamic";
