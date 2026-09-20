"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  subscribeWebPush,
  syncWebPushSubscription,
} from "@/lib/services/pushTokenService";
import {
  sendTestNotification,
  TEST_NOTIFICATION_COPY,
} from "@/lib/services/testNotification";
import { Bell, BellOff } from "lucide-react";

export function ClientPushSetup() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "enabled" | "denied" | "unsupported" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const runTestNotification = useCallback(async () => {
    setTesting(true);
    setTestFeedback(null);
    const result = await sendTestNotification();
    setTesting(false);
    setTestFeedback(
      result.ok
        ? "Test envoyé — si la bannière n'apparaît pas ou reste silencieuse, le canal de notification Android est à régler."
        : TEST_NOTIFICATION_COPY[result.reason],
    );
  }, []);

  const enablePush = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const result = await subscribeWebPush();
      if (result.success) {
        setStatus("enabled");
        return;
      }
      // A blocked permission is not an error the user can retry away — it needs a
      // trip to Chrome's settings, so it gets its own state instead of a red message.
      if (result.reason === "permission_denied") {
        setStatus("denied");
        return;
      }
      setStatus("error");
      setErrorMessage(result.error ?? "Activation impossible");
    } catch {
      setStatus("error");
      setErrorMessage("Activation impossible — réessayez");
    }
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
      // Permission alone is not enough — ensure the push_tokens row exists. This is the
      // repair path, not enrolment: calling the interactive variant here would ask for a
      // permission that is already granted and could prompt from a page the user did not
      // click on.
      void (async () => {
        setStatus("loading");
        const result = await syncWebPushSubscription();
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
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-emerald-300">
          <Bell className="h-4 w-4" />
          <span>Notifications push activées</span>
        </div>
        {testFeedback ? (
          <p className="text-sm text-neutral-400">{testFeedback}</p>
        ) : null}
        {/* Sound and the heads-up banner belong to the Android notification channel, which
            no web API can read or change — so the only way to check a settings change is to
            observe a real notification. */}
        <Button
          variant="outline"
          className="border-neutral-700 text-neutral-200"
          disabled={testing}
          onClick={() => {
            void runTestNotification();
          }}
        >
          {testing ? "Envoi…" : "Tester la notification"}
        </Button>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-300">
        <BellOff className="h-4 w-4" />
        <span>
          Notifications bloquées — ouvrez le menu à gauche de la barre d&apos;adresse :
          Informations sur le site → Autorisations → Notifications → Autoriser. Si le
          site n&apos;y figure pas, vérifiez l&apos;interrupteur global des
          notifications dans les réglages Chrome.
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
