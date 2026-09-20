/**
 * Service Worker — client portal push notifications, and the app shell's static cache.
 *
 * One registration serves two requirements that look unrelated:
 *
 * - `push` delivers the notifications.
 * - `fetch` is what Android requires before it will install a real app (a WebAPK). Chromium
 *   dropped that requirement on desktop, but Android — Brave and Chrome alike — still
 *   refuses to build the app without a worker that handles `fetch`. Critically, this gate
 *   does **not** show up in `Page.getInstallabilityErrors`, which reports an empty list for
 *   this very site: the manifest, icons and scope all pass. So a manifest alone makes the
 *   browser *offer* installation and then fail it with "impossible d'installer cette
 *   application", while push keeps working — because push only ever needed the other
 *   handler. Losing this listener silently removes the install path.
 *
 * The cache is deliberately narrow, and the two prefixes are treated differently on purpose:
 *
 * - `/_next/static/*` is content-hashed by Next, so a given URL never changes content:
 *   cache-first, and the entry can never go stale.
 * - The icon set keeps stable filenames across artwork changes — these very drawings were
 *   redesigned not long ago. Cache-first would therefore have pinned the previous ones
 *   forever, so those are fetched network-first and only fall back to the cache when offline.
 *
 * Navigations, RSC payloads, API and Supabase traffic are never intercepted: caching the
 * HTML shell is how a deploy turns into a stale app.
 */
const STATIC_CACHE = "ve-static-v1";
const IMMUTABLE_PREFIXES = ["/_next/static/"];
const REVALIDATE_PREFIXES = ["/icons/"];

self.addEventListener("install", (event) => {
  // Only immutable URLs are cached and nothing is served stale, so taking over immediately
  // is safe — and it is what lets an install fix land without waiting for every tab to close.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("ve-static-") && name !== STATIC_CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Anything that is not a same-origin GET is left to the network untouched.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const immutable = IMMUTABLE_PREFIXES.some((p) => url.pathname.startsWith(p));
  const revalidate = REVALIDATE_PREFIXES.some((p) => url.pathname.startsWith(p));
  if (!immutable && !revalidate) return;

  // Both branches stay inside `respondWith`: `waitUntil` raises `InvalidStateError` once the
  // handler has returned, so it cannot be reached after an `await` — a background refresh
  // written that way would fail at runtime. Everything therefore completes within the
  // response promise the event is already waiting on.
  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);

      if (immutable && cached) return cached;

      try {
        const response = await fetch(request);
        // Only a successful, complete response is worth storing; a 404 replayed later for a
        // path that simply is not deployed yet would be worse than no cache at all.
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        // Network-first paths fall back to the cached copy, which is what makes the app
        // shell usable offline. Without a cache there is nothing to serve: rethrow so the
        // browser reports the failure instead of us inventing a response.
        if (cached) return cached;
        throw error;
      }
    })(),
  );
});

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
  const eventType = payload.data?.type ?? null;

  // The tag decides which notifications *replace* each other, and a replacement is silent:
  // without `renotify` (not reliably supported) the new notification takes the old one's
  // place in the tray with no sound and no banner. Keying the tag on the ride alone therefore
  // swallowed the second and third moments of that ride — `ride_accepted`, `driver_arrived`
  // and `ride_completed` all carry the same ride id — so a client got one alert per ride and
  // silence after it, which reads exactly like "the notification never arrived".
  // `testNotification.ts` already documents this same-tag behaviour and refuses a tag for
  // that reason. A real push still needs one, so a re-delivered event cannot stack: the tag
  // groups per event *and* ride. Each moment alerts, a retry of the same moment replaces
  // itself.
  const tag = [eventType, rideId].filter(Boolean).join("-") || "notification";

  event.waitUntil(
    self.registration.showNotification(payload.title || "Vector Elegans", {
      body: payload.body || "",
      // The client portal has its own icon set (blue, its `theme_color`): a client who
      // installs the portal or receives a notification should not see the driver's
      // green icon.
      icon: "/icons/client/icon-192x192.png",
      // Android keeps only the alpha channel of the badge to paint the status-bar
      // icon. A full-colour icon renders as a plain white blob, so this points at
      // the dedicated white-on-transparent silhouette.
      badge: "/icons/badge-72x72.png",
      tag,
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
