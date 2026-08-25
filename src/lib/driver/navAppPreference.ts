export type NavApp = "google_maps" | "waze" | "apple_maps";

export const NAV_APP_STORAGE_KEY = "vector_elegans_preferred_nav_app";

export const NAV_APP_LABELS: Record<NavApp, string> = {
  google_maps: "Google Maps",
  waze: "Waze",
  apple_maps: "Apple Plans",
};

export function getPreferredNavApp(): NavApp | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(NAV_APP_STORAGE_KEY);
  if (raw === "google_maps" || raw === "waze" || raw === "apple_maps") {
    return raw;
  }
  return null;
}

export function setPreferredNavApp(app: NavApp): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAV_APP_STORAGE_KEY, app);
}

export function clearPreferredNavApp(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(NAV_APP_STORAGE_KEY);
}
