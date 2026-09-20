import fs from "fs";
import path from "path";

/**
 * Guards the notification/PWA image assets referenced from static files.
 *
 * Two defects motivated this test, both invisible to `tsc` because they live in
 * plain files rather than in the module graph:
 * - `sw-client.js` pointed at `/icons/icon-192x192.png` and `/icons/icon-72x72.png`
 *   which did not exist, so every client notification shipped a broken icon;
 * - the icon generator wrote SVG content into `.png` files, so even an existing
 *   path could serve the wrong bytes.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const SERVICE_WORKER = path.join(PUBLIC_DIR, "sw-client.js");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Icon paths declared by static files, whatever the quoting style. */
function referencedIconPaths(source: string): string[] {
  return [...source.matchAll(/["'`](\/icons\/[^"'`\s]+)["'`]/g)].map((match) => match[1]);
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

/** Every web app manifest in `public/`. */
function manifestFiles(): [string, Record<string, unknown>][] {
  return fs
    .readdirSync(PUBLIC_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => [name, readJson(path.join(PUBLIC_DIR, name))]);
}

function manifestIconSources(json: Record<string, unknown>): string[] {
  const icons = json.icons;
  if (!Array.isArray(icons)) return [];
  return icons
    .map((icon) => (icon as { src?: unknown }).src)
    .filter((src): src is string => typeof src === "string");
}

/** Declared `sizes` values, e.g. `"192x192"`. */
function manifestIconSizes(json: Record<string, unknown>): string[] {
  const icons = json.icons;
  if (!Array.isArray(icons)) return [];
  return icons
    .map((icon) => (icon as { sizes?: unknown }).sizes)
    .filter((sizes): sizes is string => typeof sizes === "string");
}

function isPng(filePath: string): boolean {
  return fs.readFileSync(filePath).subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

function absolute(reference: string): string {
  return path.join(PUBLIC_DIR, reference);
}

describe("notification icon assets", () => {
  it("every icon referenced by the client service worker exists", () => {
    const missing = referencedIconPaths(fs.readFileSync(SERVICE_WORKER, "utf8")).filter(
      (reference) => !fs.existsSync(absolute(reference)),
    );

    expect(missing).toEqual([]);
  });

  it("the service worker badge is the monochrome silhouette, not a colour icon", () => {
    const badge = fs
      .readFileSync(SERVICE_WORKER, "utf8")
      .match(/badge:\s*["'`]([^"'`]+)["'`]/)?.[1];

    expect(badge).toBeDefined();
    // Android keeps only the alpha channel of the badge, so a colour icon is painted
    // as a plain white blob: the badge must be the dedicated silhouette asset.
    expect(badge).toMatch(/\/badge-/);
  });

  it("every manifest icon exists and holds PNG bytes", () => {
    const missing: string[] = [];
    const notPng: string[] = [];

    for (const [name, json] of manifestFiles()) {
      for (const src of manifestIconSources(json)) {
        if (!fs.existsSync(absolute(src))) {
          missing.push(`${name}:${src}`);
          continue;
        }
        if (!isPng(absolute(src))) {
          notPng.push(`${name}:${src}`);
        }
      }
    }

    expect(missing).toEqual([]);
    expect(notPng).toEqual([]);
  });

  it("every manifest declares the 192px and 512px icons Chrome requires to install", () => {
    // Chrome's installability criteria: no 192px and 512px icon, no install prompt —
    // which is how the driver manifest stayed uninstallable while still declaring a
    // name and a scope. Checked by declared size, so each app is free to serve its own
    // icon set (driver green, client blue).
    const incomplete = manifestFiles().flatMap(([name, json]) => {
      const sizes = manifestIconSizes(json);
      const missing = ["192x192", "512x512"].filter((required) => !sizes.includes(required));
      return missing.length > 0 ? [name] : [];
    });

    expect(incomplete).toEqual([]);
  });

  it("the client manifest declares the icons Chrome requires to install the app", () => {
    const json = readJson(path.join(PUBLIC_DIR, "manifest-client.json"));
    const sources = manifestIconSources(json);

    expect(sources).toContain("/icons/client/icon-192x192.png");
    expect(sources).toContain("/icons/client/icon-512x512.png");
    expect(json.start_url).toBe("/my-account");
    expect(json.display).toBe("standalone");
  });

  it("the two apps do not share an icon: the client is blue, the driver is green", () => {
    const driver = manifestIconSources(readJson(path.join(PUBLIC_DIR, "manifest.json")));
    const client = manifestIconSources(readJson(path.join(PUBLIC_DIR, "manifest-client.json")));

    // Both sets are generated from the same car glyph, so pointing the client at the
    // driver's set is a one-line mistake that installs a green icon under the portal's
    // blue theme.
    const shared = client.filter((src) => driver.includes(src));

    expect(shared).toEqual([]);
  });
});
