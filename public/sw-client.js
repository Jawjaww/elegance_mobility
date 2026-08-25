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
