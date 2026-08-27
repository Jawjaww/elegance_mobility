"use client";

import { usePathname } from "next/navigation";
import { DriverHeader } from "@/components/layout/DriverHeader";
import { useEffect, useState } from "react";

function DriverProfileWarningListener() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ reason?: string }>).detail;
      setReason(detail?.reason ?? "Profil incomplet");
      setOpen(true);
    };
    window.addEventListener("open-driver-profile-warning", handler);
    return () =>
      window.removeEventListener("open-driver-profile-warning", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="bg-black/60 absolute inset-0"
        onClick={() => setOpen(false)}
      />
      <div className="relative bg-neutral-900 rounded-xl p-6 w-[min(680px,96%)] border border-white/10">
        <h3 className="text-lg font-semibold mb-2">Profil incomplet</h3>
        <p className="text-sm text-neutral-300 mb-4">{reason}</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-white/5"
            onClick={() => setOpen(false)}
          >
            Fermer
          </button>
          <a
            href="/driver-portal/profile/setup"
            className="px-4 py-2 rounded bg-emerald-600 text-white"
          >
            Compléter le profil
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DriverPortalLayoutClient({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isDashboard =
    pathname === "/driver-portal" || pathname === "/driver-portal/dashboard";
  const isLogin = pathname === "/driver-portal/login";

  if (isDashboard) return children;

  if (isLogin) return <div className="min-h-screen">{children}</div>;

  return (
    <div className="min-h-screen pb-20">
      <DriverHeader />
      <DriverProfileWarningListener />
      {children}
    </div>
  );
}
