"use client";

import { AdminHeader } from "@/components/layout/AdminHeader";
import { MobileAdminNav } from "@/components/layout/MobileAdminNav";

/**
 * Backoffice Portal Layout - Pure Client Component (Tauri-Ready)
 * Protection gérée par AuthGuard au niveau root (pas de double vérification)
 */
export default function BackofficePortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <AdminHeader />
      <MobileAdminNav />
      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 mobile-safe-area">
        {children}
      </main>
    </div>
  );
}
