import { buildNavigationUrl } from "@/lib/driver/navigationUrls";
import {
  getPreferredNavApp,
  setPreferredNavApp,
  NAV_APP_STORAGE_KEY,
} from "@/lib/driver/navAppPreference";

describe("buildNavigationUrl (PWA)", () => {
  it("builds Google Maps URL", () => {
    expect(
      buildNavigationUrl("google_maps", {
        lat: 43.7,
        lng: 7.26,
        address: "Nice",
      }),
    ).toContain("google.com/maps/dir/");
  });

  it("builds Waze URL", () => {
    expect(buildNavigationUrl("waze", { lat: 43.7, lng: 7.26 })).toBe(
      "https://waze.com/ul?ll=43.7,7.26&navigate=yes",
    );
  });
});

describe("navAppPreference (localStorage)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists preferred nav app", () => {
    expect(getPreferredNavApp()).toBeNull();
    setPreferredNavApp("waze");
    expect(getPreferredNavApp()).toBe("waze");
    expect(window.localStorage.getItem(NAV_APP_STORAGE_KEY)).toBe("waze");
  });
});
