"use client";

import { useEffect } from "react";
import { registerAppServiceWorker } from "@/lib/services/serviceWorkerRegistration";

/**
 * Registers the app worker on load, from the root layout so every entry point is covered —
 * the landing page, the client portal and the driver portal.
 *
 * It used to be registered only as part of the push enrolment, which left a page with **no**
 * worker at all until the user enabled notifications. That is invisible for push but fatal
 * for installation: Android builds the app only if a worker in scope handles `fetch`, so the
 * browser offered "Installer l'application" (the manifest is valid) and then failed it. See
 * `public/sw-client.js` for the full reasoning, and `docs/shared/PUSH_SETUP.md`.
 *
 * Silent by design: registration needs no permission and must never prompt. Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    void registerAppServiceWorker().then((result) => {
      // `ssr` and `unsupported` are expected states, not failures (no `navigator` while
      // rendering, or a plain-HTTP origin). Only a genuine registration error is worth a log.
      if (!result.ok && result.reason === "failed") {
        console.error("[sw] registration failed");
      }
    });
  }, []);

  return null;
}
