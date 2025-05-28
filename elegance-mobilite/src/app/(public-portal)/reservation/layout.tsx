"use client";

import { PropsWithChildren } from "react";
import { ToastProvider } from "@/hooks/useToast";

export default function ReservationLayout({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <div className="min-h-screen relative">
        {/* Background avec effet parallax */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('/map-bg.jpg')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-neutral-950/90" />
        </div>
        {children}
      </div>
    </ToastProvider>
  );
}