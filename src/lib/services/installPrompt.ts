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
 * True when the browser is Brave. Brave injects `navigator.brave`, its fingerprinting-
 * protection shim, and no other Chromium browser does.
 *
 * It matters for installation, and only *because* the portal became installable. Brave has no
 * WebAPK minting server, so it cannot complete a real install and errors out with its own
 * "impossible d'installer cet appli" ([web.dev/learn/pwa/installation](https://web.dev/learn/pwa/installation)
 * lists Brave among the browsers that fall back to shortcuts; brave-browser#7357 tracks it).
 * Until the landing page linked a manifest there was nothing to install but a bookmark
 * shortcut, and that always worked — which is why this reads as a regression introduced by the
 * manifest rather than as a browser limit.
 */
export function isBraveBrowser(nav: Navigator | undefined): boolean {
  return (nav as { brave?: unknown } | undefined)?.brave !== undefined;
}

/**
 * Whether to offer the in-page install tap.
 *
 * `beforeinstallprompt` is not enough on its own: Brave fires it exactly like Chrome, then
 * fails the install. Gating on the event alone therefore puts a button on screen whose only
 * outcome is a browser error — and whose "accepted" reply makes our own copy claim the
 * install started. A tap that cannot work is worse than the written path.
 */
export function shouldOfferDirectInstall(state: InstallState, brave: boolean): boolean {
  return state === "promptable" && !brave;
}

/**
 * Shown to a Brave user, which no amount of manifest work can help.
 *
 * One constant for both install surfaces: the same correction path written twice is how the
 * blocked-notification guidance drifted, with only one copy corrected.
 *
 * Wording avoids the verb `installer` on purpose — `landingInstallInvite.test.ts` pins that
 * verb's count in the landing dialog, and a shared constant read into that component must not
 * be the thing that breaks its guard.
 */
export const BRAVE_INSTALL_GUIDANCE =
  "Brave ne peut pas ajouter l\u2019application : il ne sait pas créer l\u2019entrée Android et l\u2019opération échoue. Passez par Chrome — vous obtiendrez l\u2019application, avec sa propre entrée dans les réglages de notifications Android, là où s\u2019activent le son et les fenêtres flottantes.";

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
