"use client";

import { supabase } from "@/lib/database/client";

export type PushPlatform = "expo" | "web";

export async function upsertPushToken(
  token: string,
  platform: PushPlatform,
  deviceLabel?: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("upsert_push_token", {
    p_token: token,
    p_platform: platform,
    p_device_label: deviceLabel ?? undefined,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (row?.success === false) {
    return { success: false, error: row.error as string };
  }

  return { success: true };
}

export async function fetchUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase.rpc("mark_notification_read", {
    notification_uuid: notificationId,
  });
  if (error) throw error;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.codePointAt(i) ?? 0;
  }
  return outputArray;
}

/**
 * Scope of the client push worker. It must stay explicit: the driver portal registers
 * its own worker (`/sw.js`) and two registrations sharing a scope replace each other,
 * which would silently drop the push handler.
 */
const PUSH_SERVICE_WORKER = "/sw-client.js";
const PUSH_SERVICE_WORKER_SCOPE = "/";

/**
 * Why a web push enrolment could not complete.
 *
 * Codes rather than prose, because three different permission outcomes need three
 * different remedies and a single "refused" message told the user nothing. Chrome
 * declining to *show* the prompt — a screen overlay from another app, a non-secure
 * origin — looked exactly like the user having blocked notifications, which points at
 * the opposite action.
 */
export type WebPushFailureReason =
  | "ssr"
  | "unsupported"
  | "insecure_context"
  | "vapid_missing"
  /** Permission is (or became) `denied`: only Chrome's site settings can undo it. */
  | "permission_denied"
  /** Chrome never displayed the prompt, so nothing was decided — the remedy is on the phone. */
  | "prompt_unavailable"
  /** Repair path only: permission was never granted, and it must not prompt to find out. */
  | "permission_not_granted"
  | "subscription_failed";

export type WebPushResult = {
  success: boolean;
  reason?: WebPushFailureReason;
  error?: string;
};

/**
 * User-facing copy per failure. Each entry names the action that actually unblocks the
 * case it describes — a generic message here is what made the failure look like a refusal.
 */
const WEB_PUSH_FAILURE_COPY: Record<WebPushFailureReason, string> = {
  ssr: "Rendu côté serveur",
  unsupported: "Push non supporté sur ce navigateur",
  insecure_context:
    "Les notifications exigent HTTPS (ou localhost) : cette page n'est pas en contexte sécurisé",
  vapid_missing: "NEXT_PUBLIC_VAPID_PUBLIC_KEY non configurée",
  permission_denied:
    "Notifications bloquées pour ce site — autorisez-les dans les réglages Chrome (Paramètres du site → Notifications)",
  prompt_unavailable:
    "Chrome n'a pas affiché la demande d'autorisation — fermez les bulles ou fenêtres superposées d'autres applications, puis réessayez",
  permission_not_granted: "Permission non accordée",
  subscription_failed: "Abonnement push impossible — réessayez",
};

function webPushFailure(
  reason: WebPushFailureReason,
  error?: string,
): WebPushResult {
  return { success: false, reason, error: error ?? WEB_PUSH_FAILURE_COPY[reason] };
}

function unsupportedWebPushReason(): WebPushFailureReason | null {
  if (typeof window === "undefined") return "ssr";
  // Checked before the API probe: on a plain-HTTP origin the service worker and
  // PushManager are missing too, and "unsupported browser" would send the user looking
  // for a browser problem that does not exist — the page just is not a secure context.
  if (!window.isSecureContext) return "insecure_context";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return "vapid_missing";
  }
  return null;
}

async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register(
    PUSH_SERVICE_WORKER,
    { scope: PUSH_SERVICE_WORKER_SCOPE },
  );
  await navigator.serviceWorker.ready;
  return registration;
}

function vapidApplicationServerKey(): ArrayBuffer {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  return urlBase64ToUint8Array(vapidPublic).buffer as ArrayBuffer;
}

/**
 * Reuses the browser's current subscription when one exists. Calling `subscribe()`
 * unconditionally mints a fresh endpoint every time, which piles up rows in
 * `push_tokens` — one per visit — and leaves dead endpoints behind.
 */
async function resolveSubscription(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidApplicationServerKey(),
  });
}

async function persistSubscription(
  subscription: PushSubscription,
): Promise<WebPushResult> {
  const result = await upsertPushToken(
    JSON.stringify(subscription),
    "web",
    navigator.userAgent.slice(0, 120),
  );
  if (result.success) return { success: true };
  // Keep the server's message: it is the only diagnostic for a row that was refused.
  return webPushFailure("subscription_failed", result.error);
}

/**
 * Registers the current subscription without ever prompting for permission.
 *
 * This is the repair path: the client portal calls it on load so a subscription that
 * the push service invalidated, or that the browser rotated, is re-registered without
 * the user having to find the notifications page again. Returns a failure when
 * permission was never granted — asking here would prompt on every page.
 */
export async function syncWebPushSubscription(): Promise<WebPushResult> {
  const unsupported = unsupportedWebPushReason();
  if (unsupported) return webPushFailure(unsupported);

  if (Notification.permission !== "granted") {
    return webPushFailure("permission_not_granted");
  }

  const registration = await registerPushServiceWorker();
  const subscription = await resolveSubscription(registration);
  return persistSubscription(subscription);
}

/** Interactive enrolment: asks for permission, then registers the subscription. */
export async function subscribeWebPush(): Promise<WebPushResult> {
  const unsupported = unsupportedWebPushReason();
  if (unsupported) return webPushFailure(unsupported);

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    // The value *after* the call is the only signal that separates the two cases, and
    // they need opposite actions. A permission left at `default` means Chrome never
    // showed the prompt at all (it refuses while another app draws an overlay over the
    // screen — chat heads, a floating player, and notably our own driver overlay
    // bubble), so asking the user to "unblock" it would be nonsense.
    return webPushFailure(
      Notification.permission === "denied"
        ? "permission_denied"
        : "prompt_unavailable",
    );
  }

  try {
    const registration = await registerPushServiceWorker();
    const subscription = await resolveSubscription(registration);
    return await persistSubscription(subscription);
  } catch (error) {
    // Swallowed on purpose: this promise is awaited from a button handler, and a
    // rejection there would leave the UI stuck on "Activation…" with no explanation.
    console.warn("[push] subscription failed:", error);
    return webPushFailure("subscription_failed");
  }
}
