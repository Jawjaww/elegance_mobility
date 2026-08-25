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

export async function subscribeWebPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (typeof window === "undefined") {
    return { success: false, error: "SSR" };
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublic) {
    return {
      success: false,
      error: "NEXT_PUBLIC_VAPID_PUBLIC_KEY non configurée",
    };
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, error: "Push non supporté sur ce navigateur" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, error: "Permission refusée" };
  }

  const registration = await navigator.serviceWorker.register("/sw-client.js");
  await navigator.serviceWorker.ready;

  const applicationServerKey = urlBase64ToUint8Array(vapidPublic)
    .buffer as ArrayBuffer;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  return upsertPushToken(
    JSON.stringify(subscription),
    "web",
    navigator.userAgent.slice(0, 120),
  );
}
