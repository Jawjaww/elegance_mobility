import {
  createInstallPromptController,
  isBraveBrowser,
  isStandaloneDisplay,
  shouldOfferDirectInstall,
} from "@/lib/services/installPrompt";

/**
 * Minimal stand-in for `window`, so the state machine is testable without a browser.
 * `beforeinstallprompt` and `appinstalled` are dispatched by the test, which is exactly
 * how the browser drives the controller.
 */
function createWindowLike(standaloneDisplay = false) {
  const listeners = new Map<string, Set<(event: Event) => void>>();

  return {
    matchMedia: (query: string) => ({
      matches: standaloneDisplay && query === "(display-mode: standalone)",
    }),
    addEventListener(type: string, listener: (event: Event) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(listener);
    },
    removeEventListener(type: string, listener: (event: Event) => void) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type: string, event: Event) {
      for (const listener of listeners.get(type) ?? []) listener(event);
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

/** A `beforeinstallprompt` event whose `prompt()`/`userChoice` the test controls. */
function createInstallEvent(outcome: "accepted" | "dismissed") {
  let promptCalls = 0;
  const event = new Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
    preventDefault: () => void;
  };
  event.prompt = () => {
    promptCalls += 1;
    return Promise.resolve();
  };
  event.userChoice = Promise.resolve({ outcome });
  return { event, promptCalls: () => promptCalls };
}

const NAV = { standalone: false } as unknown as Navigator;

describe("isStandaloneDisplay", () => {
  it("detects an installed app through display-mode", () => {
    expect(isStandaloneDisplay(createWindowLike(true), NAV)).toBe(true);
    expect(isStandaloneDisplay(createWindowLike(false), NAV)).toBe(false);
  });

  it("detects an iOS standalone app, which has no display-mode match", () => {
    const iosNav = { standalone: true } as unknown as Navigator;

    expect(isStandaloneDisplay(createWindowLike(false), iosNav)).toBe(true);
  });
});

describe("install prompt controller", () => {
  it("stays in the manual state until the browser offers an install prompt", () => {
    const controller = createInstallPromptController(createWindowLike(), NAV);

    // No event means no working button: the UI must not show one.
    expect(controller.getState()).toBe("manual");

    controller.dispose();
  });

  it("becomes promptable when the browser fires the event", () => {
    const win = createWindowLike();
    const controller = createInstallPromptController(win, NAV);
    const { event } = createInstallEvent("accepted");

    win.dispatch("beforeinstallprompt", event);

    expect(controller.getState()).toBe("promptable");

    controller.dispose();
  });

  it("cancels the browser's own install UI, so the deferred event survives for our button", () => {
    const win = createWindowLike();
    const controller = createInstallPromptController(win, NAV);
    const { event } = createInstallEvent("accepted");
    let defaultPrevented = false;
    event.preventDefault = () => {
      defaultPrevented = true;
    };

    win.dispatch("beforeinstallprompt", event);

    // Without this, the browser consumes the single-use event and `prompt()` would throw.
    expect(defaultPrevented).toBe(true);

    controller.dispose();
  });

  it("reports the user's choice and refuses to reuse a spent event", async () => {
    const win = createWindowLike();
    const controller = createInstallPromptController(win, NAV);
    const { event, promptCalls } = createInstallEvent("accepted");
    win.dispatch("beforeinstallprompt", event);

    expect(await controller.promptInstall()).toBe("accepted");
    // `prompt()` is single-use per event: a second call must not touch a spent one.
    expect(await controller.promptInstall()).toBe("unavailable");
    expect(promptCalls()).toBe(1);

    controller.dispose();
  });

  it("surfaces a dismissal instead of treating it as an error", async () => {
    const win = createWindowLike();
    const controller = createInstallPromptController(win, NAV);
    const { event } = createInstallEvent("dismissed");
    win.dispatch("beforeinstallprompt", event);

    expect(await controller.promptInstall()).toBe("dismissed");
    // The browser re-fires the event if it wants the button back, so the state falls
    // back to manual rather than pretending the app is uninstallable forever.
    expect(controller.getState()).toBe("manual");

    controller.dispose();
  });

  it("becomes installed on appinstalled, however the install was triggered", () => {
    const win = createWindowLike();
    const controller = createInstallPromptController(win, NAV);
    win.dispatch("beforeinstallprompt", createInstallEvent("accepted").event);

    // The browser may install from its own menu entry, without going through our button.
    win.dispatch("appinstalled", new Event("appinstalled"));

    expect(controller.getState()).toBe("installed");

    controller.dispose();
  });

  it("starts as installed when the page already runs as an app", () => {
    const controller = createInstallPromptController(createWindowLike(true), NAV);

    expect(controller.getState()).toBe("installed");

    controller.dispose();
  });

  it("notifies subscribers and stops once disposed", () => {
    const win = createWindowLike();
    const controller = createInstallPromptController(win, NAV);
    let notifications = 0;
    controller.subscribe(() => {
      notifications += 1;
    });

    win.dispatch("beforeinstallprompt", createInstallEvent("accepted").event);
    expect(notifications).toBe(1);

    controller.dispose();
    // A disposed controller must not keep a window listener alive: the hook unmounts and
    // remounts on navigation, and leaked listeners would accumulate.
    expect(win.listenerCount("beforeinstallprompt")).toBe(0);
    expect(win.listenerCount("appinstalled")).toBe(0);
    expect(controller.getState()).toBe("promptable");
  });
});

describe("Brave cannot complete an install", () => {
  it("recognises Brave by the shim it injects and nothing else", () => {
    // `navigator.brave` is Brave's fingerprinting-protection shim; no other Chromium browser
    // defines it. Recognising the browser is what lets the install surfaces stay silent
    // instead of inviting a tap that Brave will fail.
    expect(isBraveBrowser({ brave: {} } as unknown as Navigator)).toBe(true);
    expect(isBraveBrowser({} as unknown as Navigator)).toBe(false);
    expect(isBraveBrowser(undefined)).toBe(false);
  });

  it("refuses the direct install tap on Brave even when the event fired", () => {
    // The regression this pins: Brave fires `beforeinstallprompt` exactly like Chrome, so
    // gating the button on the event alone put a button on screen whose only outcome was
    // Brave's own error — while its "accepted" reply made our copy claim the install had
    // started. The event is a necessary condition, never a sufficient one.
    expect(shouldOfferDirectInstall("promptable", true)).toBe(false);
    expect(shouldOfferDirectInstall("promptable", false)).toBe(true);
    // Unchanged for the states that were already refused.
    expect(shouldOfferDirectInstall("manual", false)).toBe(false);
    expect(shouldOfferDirectInstall("installed", false)).toBe(false);
  });
});
