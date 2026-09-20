/**
 * Regression cover for the client web push channel.
 *
 * A single expired subscription held every client notification at sent = 0 for three
 * weeks: nothing re-registered it, and `subscribe()` minted a new endpoint on each
 * visit instead of reusing the browser's subscription. These tests pin the repair
 * path so it cannot silently regress again.
 */

jest.mock("@/lib/database/client", () => ({
  supabase: { rpc: jest.fn() },
}));

import { supabase } from "@/lib/database/client";
import {
  subscribeWebPush,
  syncWebPushSubscription,
} from "@/lib/services/pushTokenService";

const rpcMock = supabase.rpc as unknown as jest.Mock;

// Standard example VAPID public key (URL-safe base64), as returned by `web-push generate-vapid-keys`.
const VAPID_PUBLIC =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

type PushSubscriptionLike = { toJSON: () => PushSubscriptionJSON };

const EXISTING: PushSubscriptionLike = {
  toJSON: () => ({ endpoint: "https://push.example/existing" }),
};
const FRESH: PushSubscriptionLike = {
  toJSON: () => ({ endpoint: "https://push.example/fresh" }),
};

function setPermission(permission: NotificationPermission): jest.Mock {
  const requestPermission = jest.fn().mockResolvedValue(permission);
  Object.defineProperty(globalThis, "Notification", {
    configurable: true,
    value: { permission, requestPermission },
  });
  return requestPermission;
}

/**
 * jsdom does not implement `isSecureContext` (it is `undefined`), and the service now
 * refuses to enrol without it — an undefined value would be read as an insecure origin
 * and fail every test for the wrong reason. Each test states the context it assumes.
 */
function setSecureContext(value: boolean) {
  Object.defineProperty(globalThis, "isSecureContext", {
    configurable: true,
    value,
  });
}

function setPushManager(existing: PushSubscriptionLike | null) {
  const subscribe = jest.fn().mockResolvedValue(FRESH);
  const getSubscription = jest.fn().mockResolvedValue(existing);
  const registration = { pushManager: { getSubscription, subscribe } };
  const register = jest.fn().mockResolvedValue(registration);

  Object.defineProperty(globalThis.navigator, "serviceWorker", {
    configurable: true,
    value: {
      register,
      ready: Promise.resolve(registration),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  });
  (globalThis as unknown as { PushManager: unknown }).PushManager = function () {};

  return { register, subscribe, getSubscription };
}

beforeEach(() => {
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ data: [{ success: true }], error: null });
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = VAPID_PUBLIC;
  setSecureContext(true);
});

describe("syncWebPushSubscription (silent repair path)", () => {
  it("reuses the browser's existing subscription instead of minting a new endpoint", async () => {
    setPermission("granted");
    const { subscribe } = setPushManager(EXISTING);

    const result = await syncWebPushSubscription();

    expect(result.success).toBe(true);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("re-registers when the browser has no subscription left", async () => {
    setPermission("granted");
    const { subscribe } = setPushManager(null);

    const result = await syncWebPushSubscription();

    expect(result.success).toBe(true);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_push_token",
      expect.objectContaining({
        p_token: JSON.stringify(FRESH.toJSON()),
        p_platform: "web",
      }),
    );
  });

  it("never prompts for permission, so it can run on every page load", async () => {
    const requestPermission = setPermission("granted");
    setPushManager(EXISTING);

    await syncWebPushSubscription();

    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("does not touch the push service when permission was never granted", async () => {
    setPermission("default");
    const { register } = setPushManager(EXISTING);

    const result = await syncWebPushSubscription();

    expect(result.success).toBe(false);
    expect(register).not.toHaveBeenCalled();
  });

  it("fails explicitly when the VAPID public key is missing", async () => {
    setPermission("granted");
    setPushManager(EXISTING);
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    const result = await syncWebPushSubscription();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/VAPID/);
  });
});

describe("subscribeWebPush (interactive enrolment)", () => {
  it("asks for permission once and then registers", async () => {
    const requestPermission = jest.fn().mockResolvedValue("granted");
    Object.defineProperty(globalThis, "Notification", {
      configurable: true,
      value: { permission: "default", requestPermission },
    });
    const { register } = setPushManager(null);

    const result = await subscribeWebPush();

    expect(result.success).toBe(true);
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith("/sw-client.js", { scope: "/" });
  });

  it("reports the refusal without registering anything", async () => {
    const requestPermission = jest.fn().mockResolvedValue("denied");
    Object.defineProperty(globalThis, "Notification", {
      configurable: true,
      value: { permission: "default", requestPermission },
    });
    const { register } = setPushManager(null);

    const result = await subscribeWebPush();

    expect(result.success).toBe(false);
    expect(register).not.toHaveBeenCalled();
  });

  /**
   * The regression this file exists for. Chrome refusing to *show* the prompt — a screen
   * overlay from another app is the usual cause — leaves the permission at `default`.
   * Reporting that as "refused" told the user to unblock something that was never
   * blocked, which is the opposite of the action that unblocks it.
   */
  it("separates a prompt Chrome never showed from a refusal", async () => {
    setPermission("default");
    const { register } = setPushManager(null);

    const result = await subscribeWebPush();

    expect(result.success).toBe(false);
    expect(result.reason).toBe("prompt_unavailable");
    expect(result.error).toMatch(/superposées/);
    expect(result.error).not.toMatch(/refusée/i);
    expect(register).not.toHaveBeenCalled();
  });

  it("points a blocked permission at the address-bar menu, not the site list", async () => {
    setPermission("denied");
    setPushManager(null);

    const result = await subscribeWebPush();

    expect(result.reason).toBe("permission_denied");
    // Chrome's per-site notification list only holds sites with an explicit decision,
    // so it dead-ends when the block is global or imposed by Android. The address-bar
    // menu acts on the current site, so it holds in both cases.
    expect(result.error).toMatch(/barre d'adresse/);
    expect(result.error).toMatch(/Autorisations/);
  });

  it("refuses to enrol on a non-secure origin, before probing the browser", async () => {
    setSecureContext(false);
    setPermission("default");
    const { register } = setPushManager(null);

    const result = await subscribeWebPush();

    expect(result.success).toBe(false);
    expect(result.reason).toBe("insecure_context");
    expect(result.error).toMatch(/HTTPS/);
    expect(register).not.toHaveBeenCalled();
  });

  it("never rejects when the push service refuses, so the button cannot hang", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    setPermission("granted");
    const { register } = setPushManager(null);
    register.mockRejectedValue(new Error("push service unavailable"));

    const result = await subscribeWebPush();

    expect(result).toEqual({
      success: false,
      reason: "subscription_failed",
      error: expect.stringContaining("Abonnement push impossible"),
    });
  });
});
