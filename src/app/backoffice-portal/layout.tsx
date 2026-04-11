"use client";

import { AdminHeader } from "@/components/layout/AdminHeader";
import { MobileAdminNav } from "@/components/layout/MobileAdminNav";

/**
 * Backoffice Portal Layout - Pure Client Component (Tauri-Ready)
 * Protection gérée par AuthGuard au niveau root (pas de double vérification)
 */
export default function BackofficePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <AdminHeader />
      <MobileAdminNav />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
