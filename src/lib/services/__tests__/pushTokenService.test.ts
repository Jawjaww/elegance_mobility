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
});
