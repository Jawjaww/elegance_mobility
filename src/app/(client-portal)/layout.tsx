import type { Metadata } from "next";
import { ClientLayout } from "@/components/layout";
import { ClientPushSync } from "@/components/account/ClientPushSync";

/**
 * Client Portal Layout (Tauri-Ready)
 * Auth protection is handled by the root AuthGuard, not here.
 *
 * Kept as a server component so it can export route metadata: the client manifest
 * link is what makes the portal installable, and an installed web app is the only
 * way to get a notification channel the user can raise to "sound + pop on screen"
 * (see docs/shared/PUSH_SETUP.md). Everything it renders is already a client
 * component, so no interactivity is lost.
 */
export const metadata: Metadata = {
  manifest: "/manifest-client.json",
};

export default function ClientPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientLayout>
      <ClientPushSync />
      {children}
    </ClientLayout>
  );
}
