"use client";

import { ClientLayout } from "@/components/layout";
import { ClientPushSync } from "@/components/account/ClientPushSync";

/**
 * Client Portal Layout - Pure Client Component (Tauri-Ready)
 * Protection gérée par AuthGuard au niveau root (pas de double vérification)
 */
export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      <ClientPushSync />
      {children}
    </ClientLayout>
  );
}
