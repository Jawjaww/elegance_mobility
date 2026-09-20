/**
 * In-app install prompt for an installed web app (WebAPK on Android).
 *
 * Installing matters for notifications specifically: on Android the notification's sound and
 * "pop on screen" banner are properties of an Android notification channel, and the channel
 * belongs to the installed app. A visited site gets the browser's generic channel, which
 * defaults to sound-only. Installing therefore hands the user a channel they can raise —
 * it does not by itself guarantee a banner.
 *
 * What a web page can and cannot do here:
 * - it CAN show the browser's install dialog, via the deferred `beforeinstallprompt` event;
 * - it CANNOT open Android's notification settings, nor Chrome's site settings: no web API
 *   exists for either. That boundary is why this module offers an install action and the
 *   UI shows written instructions for the rest.
 *
 * `beforeinstallprompt` is non-standard (Chromium-only) and only fires when the browser
 * judges the app installable. iOS never fires it — Safari installs from the Share menu —
 * hence the explicit `manual` state rather than an always-visible button that would do
 * nothing when tapped.
 */
export type InstallState =
  /** Already running as an installed app. */
  | "installed"
  /** The event fired and was deferred: `promptInstall()` will show the dialog. */
  | "promptable"
  /** No event (iOS, or the browser did not offer it): install from the browser menu. */
  | "manual";

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

/** `BeforeInstallPromptEvent` is not in the DOM lib: declared here, used structurally. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type WindowLike = Pick<Window, "addEventListener" | "removeEventListener"> & {
  matchMedia?: (query: string) => { matches: boolean };
};

export type InstallPromptController = {
  getState: () => InstallState;
  subscribe: (listener: () => void) => () => void;
  promptInstall: () => Promise<InstallOutcome>;
  dispose: () => void;
};

/** True when the page runs as an installed app rather than inside a browser tab. */
export function isStandaloneDisplay(win: WindowLike, nav: Navigator): boolean {
  const iosStandalone = (nav as { standalone?: boolean }).standalone === true;
  const displayStandalone = win.matchMedia?.("(display-mode: standalone)")?.matches === true;
  return iosStandalone || displayStandalone;
}

/**
 * Owns the lifetime of the deferred install event.
 *
 * The window and navigator are injected rather than read from globals, so the whole state
 * machine is exercisable in tests without a browser.
 */
export function createInstallPromptController(
  win: WindowLike,
  nav: Navigator,
): InstallPromptController {
  let deferred: BeforeInstallPromptEvent | null = null;
  let installed = isStandaloneDisplay(win, nav);
  const listeners = new Set<() => void>();
  const notify = () => {
    // `forEach` rather than `for...of`: the project targets ES5, where iterating a `Set`
    // requires `--downlevelIteration`.
    listeners.forEach((listener) => listener());
  };

  const onBeforeInstallPrompt = (event: Event) => {
    // Suppress the browser's own install UI: the event is single-use, so letting the
    // browser consume it here would leave our button permanently inert.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  };

  const onAppInstalled = () => {
    installed = true;
    deferred = null;
    notify();
  };

  win.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  win.addEventListener("appinstalled", onAppInstalled);

  return {
    getState: () => {
      if (installed) return "installed";
      return deferred ? "promptable" : "manual";
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    promptInstall: async () => {
      if (!deferred) return "unavailable";

      // `prompt()` may only be called once per event. Clearing it first means a second
      // tap cannot reuse a spent event — the browser re-fires one if it wants the button
      // back, which is why a dismissal is not an error.
      const event = deferred;
      deferred = null;
      notify();

      await event.prompt();
      const { outcome } = await event.userChoice;
      return outcome;
    },
    dispose: () => {
      win.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      win.removeEventListener("appinstalled", onAppInstalled);
      listeners.clear();
    },
  };
}
