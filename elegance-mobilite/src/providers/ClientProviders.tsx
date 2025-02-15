"use client";

import { Suspense } from "react";
import { ToastProvider } from "@/hooks/useToast";
import { ReservationProvider } from "./ReservationProvider";

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-neutral-950/80 flex items-center justify-center">
      <div className="bg-neutral-900/50 backdrop-blur-lg p-6 rounded-lg border border-neutral-800">
        <div className="space-y-4">
          <div className="h-8 w-32 bg-neutral-800 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-neutral-800 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export function ClientProviders({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ToastProvider>
        <div suppressHydrationWarning>
          <ReservationProvider>
            {children}
          </ReservationProvider>
        </div>
      </ToastProvider>
    </Suspense>
  );
}