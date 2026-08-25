import {
  getPreferredNavApp,
  setPreferredNavApp,
  NAV_APP_LABELS,
  type NavApp,
} from "./navAppPreference";
import {
  buildNavigationUrl,
  type NavDestination,
} from "./navigationUrls";

export type { NavApp, NavDestination };
export { buildNavigationUrl };

/** Browser-only picker; returns null when cancelled. */
export function pickNavApp(): Promise<NavApp | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px";

    const panel = document.createElement("div");
    panel.style.cssText =
      "background:#171717;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;max-width:320px;width:100%";

    const title = document.createElement("p");
    title.textContent = "Application GPS";
    title.style.cssText =
      "color:#fff;font-weight:600;margin:0 0 8px;font-size:16px";

    const subtitle = document.createElement("p");
    subtitle.textContent =
      "Choisissez votre application de navigation préférée.";
    subtitle.style.cssText =
      "color:#a3a3a3;margin:0 0 16px;font-size:13px;line-height:1.4";

    panel.appendChild(title);
    panel.appendChild(subtitle);

    const apps: NavApp[] = ["google_maps", "waze", "apple_maps"];

    const cleanup = () => overlay.remove();

    apps.forEach((app) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = NAV_APP_LABELS[app];
      btn.style.cssText =
        "display:block;width:100%;margin-bottom:8px;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:#262626;color:#fff;font-weight:600;cursor:pointer";
      btn.onclick = () => {
        cleanup();
        resolve(app);
      };
      panel.appendChild(btn);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Annuler";
    cancel.style.cssText =
      "display:block;width:100%;padding:12px;border-radius:8px;border:none;background:transparent;color:#a3a3a3;cursor:pointer";
    cancel.onclick = () => {
      cleanup();
      resolve(null);
    };
    panel.appendChild(cancel);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  });
}

export async function openExternalNavigation(
  dest: NavDestination,
  options?: { forcePicker?: boolean; app?: NavApp },
): Promise<boolean> {
  let app =
    options?.app ??
    (options?.forcePicker ? null : getPreferredNavApp());

  if (!app) {
    app = await pickNavApp();
    if (!app) return false;
    setPreferredNavApp(app);
  }

  const url = buildNavigationUrl(app, dest);
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export async function changePreferredNavApp(): Promise<NavApp | null> {
  const app = await pickNavApp();
  if (app) setPreferredNavApp(app);
  return app;
}
