import { getCurrentUser, hasDriverAccess } from "@/lib/database/server";
import { redirect } from "next/navigation";

export default async function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérifier si l'utilisateur a accès au portail chauffeur
  const user = await getCurrentUser();
  
  if (!user || !hasDriverAccess(user.role)) {
    redirect('/driver-portal/login');
  }
  
  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-emerald-950 to-neutral-950 text-neutral-100">
      {/* Header et navigation du portail chauffeur à implémenter */}
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      
      {/* Footer si nécessaire */}
    </div>
  );
}

// Opt-out du cache pour toujours vérifier les permissions
export const revalidate = 0

// Force le rendu dynamique
export const dynamic = 'force-dynamic'
