"use client";

import { PropsWithChildren } from "react";
import { ToastProvider } from "@/hooks/useToast";
import { PublicPageShell } from "@/components/landing/PublicPageShell";

export default function ReservationLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <ToastProvider>
      <PublicPageShell>{children}</PublicPageShell>
    </ToastProvider>
  );
}
