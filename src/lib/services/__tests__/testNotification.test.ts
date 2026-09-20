import {
  CLIENT_NOTIFICATION_ICON,
  NOTIFICATION_BADGE,
  sendTestNotification,
  TEST_NOTIFICATION_COPY,
} from "@/lib/services/testNotification";

/**
 * jsdom ships neither `Notification` nor `navigator.serviceWorker`, so each test declares
 * the environment it assumes and removes it again. Asserting on a half-configured
 * environment is how a test passes for the wrong reason.
 */
function setNotification(permission: NotificationPermission | null) {
  if (permission === null) {
    Reflect.deleteProperty(globalThis, "Notification");
    return;
  }
  Object.defineProperty(globalThis, "Notification", {
    value: { permission },
    configurable: true,
    writable: true,
  });
}

function setServiceWorker(
  registration: { showNotification: jest.Mock } | null | "absent",
) {
  if (registration === "absent") {
    Reflect.deleteProperty(navigator, "serviceWorker");
    return;
  }
  const getRegistration = jest.fn().mockResolvedValue(registration ?? undefined);
  Object.defineProperty(navigator, "serviceWorker", {
    value: { getRegistration },
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  setNotification(null);
  setServiceWorker("absent");
});

describe("sendTestNotification", () => {
  it("reports an unsupported browser when the Notification API is missing", async () => {
    setNotification(null);

    await expect(sendTestNotification()).resolves.toEqual({
      ok: false,
      reason: "unsupported",
    });
  });

  it("reports an unsupported browser when push is unavailable", async () => {
    setNotification("granted");
    setServiceWorker("absent");

    await expect(sendTestNotification()).resolves.toEqual({
      ok: false,
      reason: "unsupported",
    });
  });

  it("refuses to test without permission, and shows nothing", async () => {
    setNotification("denied");
    const showNotification = jest.fn();
    setServiceWorker({ showNotification });

    await expect(sendTestNotification()).resolves.toEqual({
      ok: false,
      reason: "permission_not_granted",
    });
    expect(showNotification).not.toHaveBeenCalled();
  });

  it("explains a missing registration instead of waiting forever", async () => {
    setNotification("granted");
    // `serviceWorker.ready` never settles without a registration, which would hang the
    // button; the implementation must therefore use `getRegistration()`.
    setServiceWorker(null);

    await expect(sendTestNotification()).resolves.toEqual({
      ok: false,
      reason: "no_service_worker",
    });
  });

  it("shows a notification carrying the real client assets", async () => {
    setNotification("granted");
    const showNotification = jest.fn().mockResolvedValue(undefined);
    setServiceWorker({ showNotification });

    await expect(sendTestNotification()).resolves.toEqual({ ok: true });
    expect(showNotification).toHaveBeenCalledTimes(1);

    const [title, options] = showNotification.mock.calls[0];
    expect(title).toBeTruthy();
    expect(options.body).toBeTruthy();
    // Same assets as a real dispatch, otherwise the test would not prove what the user
    // actually sees — and these paths 404'd in production before they were generated.
    expect(options.icon).toBe(CLIENT_NOTIFICATION_ICON);
    expect(options.badge).toBe(NOTIFICATION_BADGE);
  });

  it("sends each test without a tag, so a repeat test is not silently swallowed", async () => {
    setNotification("granted");
    const showNotification = jest.fn().mockResolvedValue(undefined);
    setServiceWorker({ showNotification });

    await sendTestNotification();

    // A `tag` would make the browser replace the previous notification *without alerting*
    // unless `renotify` is set, which is not reliably supported — a silent second test
    // would read as "sound is broken" when it is not.
    expect(showNotification.mock.calls[0][1]).not.toHaveProperty("tag");
  });

  it("never rejects when the push service refuses to display", async () => {
    setNotification("granted");
    setServiceWorker({
      showNotification: jest.fn().mockRejectedValue(new Error("display refused")),
    });

    await expect(sendTestNotification()).resolves.toEqual({
      ok: false,
      reason: "failed",
    });
  });

  it("gives every failure its own actionable sentence", () => {
    // A shared message is how the earlier "prompt never shown" bug hid behind a refusal.
    const messages = Object.values(TEST_NOTIFICATION_COPY);
    expect(new Set(messages).size).toBe(messages.length);
    for (const message of messages) {
      expect(message.length).toBeGreaterThan(10);
    }
  });
});
