"use client";

import { ThemeProvider } from "./ThemeProvider";
import { ReactNode, useEffect, useRef } from "react";
import { ToastProvider, useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/database/client";

interface ClientProvidersProps {
  children: ReactNode;
}

function ClientProvidersInner({ children }: Readonly<ClientProvidersProps>) {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    // Centralisé: ClientProviders écoute les événements et applique la session
    const setHandler = async (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      if (!detail) return;
      try {
        await supabase.auth.setSession({
          access_token: detail.access_token,
          refresh_token: detail.refresh_token,
        });
        console.debug("[ClientProviders] session applied from event");
      } catch (err) {
        console.error("[ClientProviders] failed to set session", err);
      }
    };

    const clearHandler = async () => {
      try {
        await supabase.auth.signOut();
        console.debug("[ClientProviders] session cleared from event");
      } catch (err) {
        console.error("[ClientProviders] failed to clear session", err);
      }
    };

    // Intercepteur d'erreurs 403 — affiche un toast de reconnexion
    const authErrorHandler = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      toastRef.current({
        title: detail?.title || "Session expirée",
        description: detail?.description || "Veuillez vous reconnecter.",
        variant: "destructive",
      });
    };

    globalThis.addEventListener("elegance:setSession", setHandler as EventListener);
    globalThis.addEventListener(
      "elegance:clearSession",
      clearHandler as EventListener,
    );
    globalThis.addEventListener(
      "elegance:authError",
      authErrorHandler as EventListener,
    );

    return () => {
      globalThis.removeEventListener(
        "elegance:setSession",
        setHandler as EventListener,
      );
      globalThis.removeEventListener(
        "elegance:clearSession",
        clearHandler as EventListener,
      );
      globalThis.removeEventListener(
        "elegance:authError",
        authErrorHandler as EventListener,
      );
    };
  }, []);

  return <>{children}</>;
}

export function ClientProviders({ children }: Readonly<ClientProvidersProps>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ToastProvider>
        <ClientProvidersInner>{children}</ClientProvidersInner>
      </ToastProvider>
    </ThemeProvider>
  );
}
