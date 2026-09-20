/**
 * Sends a local test notification, to verify the notification channel itself.
 *
 * Why local and not through `dispatch-push`: this isolates the one thing the user can
 * actually fix. If a locally-shown notification is silent, the Android channel is the
 * cause; if it has sound and a banner, the channel is fine and a silent *push* is a
 * different problem. Routing the test through the server would conflate the two.
 *
 * It is also the only way to check the result of a settings change: nothing in the web
 * platform reports a channel's sound or importance, so the user must observe a real
 * notification after changing it.
 */

/**
 * Must stay in sync with `public/sw-client.js`. The service worker is a plain asset and
 * cannot import from `src`, so the paths are duplicated — and
 * `src/__tests__/notificationAssets.test.ts` asserts both copies point at real files.
 */
export const CLIENT_NOTIFICATION_ICON = "/icons/client/icon-192x192.png";
export const NOTIFICATION_BADGE = "/icons/badge-96x96.png";

export type TestNotificationFailure =
  | "unsupported"
  | "permission_not_granted"
  | "no_service_worker"
  | "failed";

export type TestNotificationResult =
  | { ok: true }
  | { ok: false; reason: TestNotificationFailure };

/** One actionable sentence per failure — a generic message would hide the next step. */
export const TEST_NOTIFICATION_COPY: Record<TestNotificationFailure, string> = {
  unsupported: "Les notifications ne sont pas disponibles sur ce navigateur",
  permission_not_granted: "Activez d'abord les notifications push",
  no_service_worker: "Service worker inactif — rechargez la page, puis réessayez",
  failed: "Envoi du test impossible — réessayez",
};

export async function sendTestNotification(): Promise<TestNotificationResult> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return { ok: false, reason: "unsupported" };
  }

  if (Notification.permission !== "granted") {
    return { ok: false, reason: "permission_not_granted" };
  }

  try {
    // `getRegistration()` rather than `ready`: `ready` never settles when no worker is
    // registered, which would leave the button waiting forever instead of explaining.
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { ok: false, reason: "no_service_worker" };
    }

    // Deliberately no `tag`. With one, a second test would *silently* replace the first —
    // same-tag replacement does not alert unless `renotify` is set, which is not reliably
    // supported. The alert is the entire point of this button, so stacking is preferable.
    await registration.showNotification("Notification de test", {
      body: "Si vous voyez cette bannière et entendez ce son, le canal est bien réglé.",
      icon: CLIENT_NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
