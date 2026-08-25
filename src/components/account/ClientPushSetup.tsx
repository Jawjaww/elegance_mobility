"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeWebPush } from "@/lib/services/pushTokenService";
import { Bell, BellOff } from "lucide-react";

export function ClientPushSetup() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "enabled" | "denied" | "unsupported" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const enablePush = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    const result = await subscribeWebPush();
    if (result.success) {
      setStatus("enabled");
      return;
    }
    setStatus("error");
    setErrorMessage(result.error ?? "Activation impossible");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (Notification.permission === "granted") {
      // Permission alone is not enough — ensure push_tokens row exists.
      void (async () => {
        setStatus("loading");
        const result = await subscribeWebPush();
        if (result.success) {
          setStatus("enabled");
          return;
        }
        setStatus("error");
        setErrorMessage(result.error ?? "Réactivation push impossible");
      })();
    }
  }, []);

  if (status === "unsupported") {
    return (
      <p className="text-sm text-neutral-400">
        Les notifications push ne sont pas disponibles sur ce navigateur.
      </p>
    );
  }

  if (status === "enabled") {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-300">
        <Bell className="h-4 w-4" />
        <span>Notifications push activées</span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-300">
        <BellOff className="h-4 w-4" />
        <span>
          Notifications bloquées — autorisez-les dans les réglages du navigateur.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-400">
        Recevez une alerte quand un chauffeur accepte votre course, arrive au
        point de prise en charge, ou termine la course (même app en
        arrière-plan).
      </p>
      {errorMessage ? (
        <p className="text-sm text-red-300">{errorMessage}</p>
      ) : null}
      <Button
        className="bg-blue-600 hover:bg-blue-700"
        disabled={status === "loading"}
        onClick={() => {
          void enablePush();
        }}
      >
        {status === "loading" ? "Activation…" : "Activer les notifications push"}
      </Button>
    </div>
  );
}
