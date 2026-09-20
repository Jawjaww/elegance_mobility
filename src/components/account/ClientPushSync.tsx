"use client";

import { useEffect } from "react";
import {
  syncWebPushSubscription,
  upsertPushToken,
} from "@/lib/services/pushTokenService";

/**
 * Keeps the client's web push subscription registered for the whole portal session.
 *
 * The push service can invalidate a subscription (expired, unsubscribed) or the
 * browser can rotate it. Without a repair path the only way back was for the user to
 * find their notification settings and re-enable push — which nobody does, so the
 * channel stayed dead silently.
 *
 * Deliberately silent: it never requests permission, otherwise it would prompt on
 * every page. Renders nothing.
 */
export function ClientPushSync() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void syncWebPushSubscription().catch((err: unknown) => {
      console.error("[push] subscription sync failed:", err);
    });

    // The worker renews a rotated subscription and hands the new endpoint over.
    const onMessage = (event: MessageEvent) => {
      const payload = event.data as
        | { type?: string; subscription?: PushSubscriptionJSON }
        | null;
      if (payload?.type !== "PUSH_SUBSCRIPTION_CHANGED" || !payload.subscription) {
        return;
      }
      void upsertPushToken(
        JSON.stringify(payload.subscription),
        "web",
        navigator.userAgent.slice(0, 120),
      ).catch((err: unknown) => {
        console.error("[push] rotated subscription registration failed:", err);
      });
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}
