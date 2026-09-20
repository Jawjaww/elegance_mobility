/**
 * Service Worker — client portal push notifications
 */
self.addEventListener("push", (event) => {
  let payload = { title: "Vector Elegans", body: "Nouvelle notification" };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  const rideId = payload.data?.ride_id ?? payload.rideId ?? null;

  event.waitUntil(
    self.registration.showNotification(payload.title || "Vector Elegans", {
      body: payload.body || "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: rideId ? `ride-${rideId}` : "notification",
      data: { rideId, ...payload.data },
    }),
  );
});

/**
 * The push service can rotate or invalidate a subscription at any time (browser
 * update, storage eviction, long inactivity). Without this handler the old endpoint
 * stays in `push_tokens` and every later dispatch fails against a subscription the
 * browser no longer knows about.
 *
 * `oldSubscription.options.applicationServerKey` carries the VAPID key the
 * subscription was created with, so the worker can renew it without the page.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const applicationServerKey =
        event.oldSubscription?.options?.applicationServerKey;
      if (!applicationServerKey) return;

      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Best effort: any open tab re-registers the new endpoint. When no tab is
      // open, the next app load repairs it from `pushManager.getSubscription()`.
      const list = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of list) {
        client.postMessage({
          type: "PUSH_SUBSCRIPTION_CHANGED",
          subscription: subscription.toJSON(),
        });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rideId = event.notification.data?.rideId;
  const target = rideId
    ? `/my-account/reservations`
    : "/my-account/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(target);
    }),
  );
});
