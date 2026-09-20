/**
 * Regression cover for the registration shared by the push enrolment and the load-time
 * registrar.
 *
 * The URL and the scope are the load-bearing part. Two registrations that share a scope
 * replace each other, so a drifting scope would silently evict whichever worker registered
 * second — taking either the notification channel or the install path with it.
 */

import {
  APP_SERVICE_WORKER,
  APP_SERVICE_WORKER_SCOPE,
  registerAppServiceWorker,
} from "@/lib/services/serviceWorkerRegistration";

/**
 * jsdom leaves `isSecureContext` undefined, and the module refuses to register without it —
 * an undefined value would read as an insecure origin and fail a test for the wrong reason.
 */
function setSecureContext(value: boolean) {
  Object.defineProperty(globalThis, "isSecureContext", {
    configurable: true,
    value,
  });
}

function setServiceWorker(value: unknown) {
  Object.defineProperty(globalThis.navigator, "serviceWorker", {
    configurable: true,
    value,
  });
}

/** Removes the property outright: the module probes with `in`, not for a truthy value. */
function clearServiceWorker() {
  Reflect.deleteProperty(globalThis.navigator, "serviceWorker");
}

afterEach(() => {
  setSecureContext(true);
});

describe("registerAppServiceWorker", () => {
  it("registers the app worker under the explicit root scope", async () => {
    const registration = { scope: "/" };
    const register = jest.fn().mockResolvedValue(registration);
    setSecureContext(true);
    setServiceWorker({ register });

    const result = await registerAppServiceWorker();

    expect(register).toHaveBeenCalledWith(APP_SERVICE_WORKER, {
      scope: APP_SERVICE_WORKER_SCOPE,
    });
    // The constants are asserted separately so a rename that keeps the pair consistent
    // still fails loudly here: the worker file is a static asset whose name is part of the
    // contract, not an internal detail.
    expect(APP_SERVICE_WORKER).toBe("/sw-client.js");
    expect(APP_SERVICE_WORKER_SCOPE).toBe("/");
    expect(result).toEqual({ ok: true, registration });
  });

  it("reports an insecure or unsupported context without attempting a registration", async () => {
    const register = jest.fn();
    setSecureContext(false);
    setServiceWorker({ register });

    await expect(registerAppServiceWorker()).resolves.toEqual({
      ok: false,
      reason: "unsupported",
    });
    expect(register).not.toHaveBeenCalled();
  });

  it("reports a missing service worker API without attempting a registration", async () => {
    const register = jest.fn();
    setSecureContext(true);
    setServiceWorker({ register });
    clearServiceWorker();

    await expect(registerAppServiceWorker()).resolves.toEqual({
      ok: false,
      reason: "unsupported",
    });
    expect(register).not.toHaveBeenCalled();
  });

  it("resolves a failure instead of rejecting, so callers need no catch", async () => {
    const register = jest.fn().mockRejectedValue(new Error("boom"));
    setSecureContext(true);
    setServiceWorker({ register });

    await expect(registerAppServiceWorker()).resolves.toEqual({
      ok: false,
      reason: "failed",
    });
  });
});
