"use client";

import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { MobileAdminNav } from "@/components/layout/MobileAdminNav";
import { BackofficeAuthGuard } from "@/components/auth/BackofficeAuthGuard";
import { isBackofficeLoginPath } from "@/lib/auth/backoffice-auth";

/**
 * Backoffice layout: login is public (no admin chrome); all other routes are
 * gated by BackofficeAuthGuard before rendering dashboard content.
 */
export default function BackofficePortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  if (isBackofficeLoginPath(pathname)) {
    return <div className="min-h-screen bg-neutral-950 text-white">{children}</div>;
  }

  return (
    <BackofficeAuthGuard>
      <div className="min-h-screen bg-neutral-950 text-white">
        <AdminHeader />
        <MobileAdminNav />
        <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 mobile-safe-area">
          {children}
        </main>
      </div>
    </BackofficeAuthGuard>
  );
}
