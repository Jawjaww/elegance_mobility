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

function webPushUnsupportedReason(): string | null {
  if (typeof window === "undefined") return "SSR";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "Push non supporté sur ce navigateur";
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return "NEXT_PUBLIC_VAPID_PUBLIC_KEY non configurée";
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
): Promise<{ success: boolean; error?: string }> {
  return upsertPushToken(
    JSON.stringify(subscription),
    "web",
    navigator.userAgent.slice(0, 120),
  );
}

/**
 * Registers the current subscription without ever prompting for permission.
 *
 * This is the repair path: the client portal calls it on load so a subscription that
 * the push service invalidated, or that the browser rotated, is re-registered without
 * the user having to find the notifications page again. Returns a failure when
 * permission was never granted — asking here would prompt on every page.
 */
export async function syncWebPushSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  const unsupported = webPushUnsupportedReason();
  if (unsupported) return { success: false, error: unsupported };

  if (Notification.permission !== "granted") {
    return { success: false, error: "Permission non accordée" };
  }

  const registration = await registerPushServiceWorker();
  const subscription = await resolveSubscription(registration);
  return persistSubscription(subscription);
}

/** Interactive enrolment: asks for permission, then registers the subscription. */
export async function subscribeWebPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  const unsupported = webPushUnsupportedReason();
  if (unsupported) return { success: false, error: unsupported };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, error: "Permission refusée" };
  }

  const registration = await registerPushServiceWorker();
  const subscription = await resolveSubscription(registration);
  return persistSubscription(subscription);
}
