import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { supabase } from '@/lib/database/client';
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AlreadyLoggedIn({ role }: { role?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  let dashboard = "/";
  if (role === "app_driver") dashboard = "/driver-portal/dashboard";
  else if (role === "app_customer") dashboard = "/client-portal/dashboard";
  else if (role === "app_admin") dashboard = "/backoffice-portal/dashboard";

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.replace("/");
  };

  return (
    <Card className="w-full max-w-[425px] mt-12">
      <CardHeader>
        <CardTitle>Vous êtes déjà connecté</CardTitle>
        <CardDescription>
          Pour accéder à cette page, vous devez d'abord vous déconnecter.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <button
          className="btn-gradient px-4 py-2 rounded text-white flex items-center gap-2"
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="w-4 h-4" />
          {loading ? "Déconnexion..." : "Se déconnecter"}
        </button>
        <a href={dashboard} className="text-blue-500 hover:underline text-sm">Aller au tableau de bord</a>
      </CardContent>
    </Card>
  );
}
