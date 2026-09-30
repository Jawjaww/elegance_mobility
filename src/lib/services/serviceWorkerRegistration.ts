/**
 * The one service worker the web app registers, and the only place its URL and scope are
 * written down.
 *
 * The scope must stay explicit. Two registrations sharing a scope replace each other, so an
 * implicit scope would let a later registration silently evict the worker the push channel
 * was relying on — the same handler that Android also needs to install the app.
 *
 * Registration is idempotent: calling it again returns the existing registration, which is
 * what lets the push enrolment and the load-time registration share this function instead
 * of duplicating the registration call.
 */

export const APP_SERVICE_WORKER = "/sw-client.js";
export const APP_SERVICE_WORKER_SCOPE = "/";

export type ServiceWorkerFailureReason =
  /** Server-side render: there is no `navigator` to register with. */
  | "ssr"
  /** Plain-HTTP origin, or a browser without service workers. Nothing to report. */
  | "unsupported"
  | "failed";

export type AppServiceWorkerResult =
  | { ok: true; registration: ServiceWorkerRegistration }
  | { ok: false; reason: ServiceWorkerFailureReason };

export async function registerAppServiceWorker(): Promise<AppServiceWorkerResult> {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };

  // `isSecureContext` first: on a plain-HTTP origin `serviceWorker` is missing as well, and
  // "unsupported browser" would send someone looking for a browser problem that is really a
  // missing HTTPS origin.
  if (!window.isSecureContext || !("serviceWorker" in navigator)) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const registration = await navigator.serviceWorker.register(APP_SERVICE_WORKER, {
      scope: APP_SERVICE_WORKER_SCOPE,
    });
    return { ok: true, registration };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/**
 * Android WebAPK install can fail with a generic error if `prompt()` runs before the worker
 * is active, even when `beforeinstallprompt` already fired. Callers that open the install
 * dialog should await this after `registerAppServiceWorker()`.
 */
export async function waitForAppServiceWorkerActive(
  registration: ServiceWorkerRegistration,
  timeoutMs = 12_000,
): Promise<boolean> {
  if (registration.active) return true;

  const worker = registration.installing ?? registration.waiting;
  if (!worker) return Boolean(registration.active);

  if (worker.state === "activated") return true;

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(false), timeoutMs);
    const onStateChange = () => {
      if (worker.state !== "activated") return;
      window.clearTimeout(timer);
      worker.removeEventListener("statechange", onStateChange);
      resolve(true);
    };
    worker.addEventListener("statechange", onStateChange);
  });
}
