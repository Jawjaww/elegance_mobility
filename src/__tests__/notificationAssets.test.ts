import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  CLIENT_NOTIFICATION_ICON,
  NOTIFICATION_BADGE,
} from "@/lib/services/testNotification";

/**
 * Guards the notification/PWA image assets referenced from static files.
 *
 * Defects motivated this test, all invisible to `tsc` because they live in plain files
 * rather than in the module graph:
 * - `sw-client.js` pointed at `/icons/icon-192x192.png` and `/icons/icon-72x72.png`
 *   which did not exist, so every client notification shipped a broken icon;
 * - the icon generator wrote SVG content into `.png` files, so even an existing
 *   path could serve the wrong bytes;
 * - the artwork was a car *emoji* drawn with `<text>`, and `sharp`/librsvg has no colour
 *   emoji font, so the committed PNGs shipped a solid black blob: 25 % of the canvas was
 *   opaque `0,0,0`, offset +13 px right and +6.5 px down of centre.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");
const SERVICE_WORKER = path.join(PUBLIC_DIR, "sw-client.js");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Icon SVG sources, in the root set and the client set. */
function iconSourceFiles(): string[] {
  return [ICONS_DIR, path.join(ICONS_DIR, "client")].flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((name) => name.endsWith(".svg"))
      .map((name) => path.join(dir, name)),
  );
}

/**
 * Rasterised assets to inspect, each with the way its glyph reads against its background:
 * the app icons draw white strokes over a gradient, the status-bar badge is a white
 * silhouette over transparency.
 */
function rasterFiles(): { file: string; glyph: "white" | "alpha" }[] {
  const out: { file: string; glyph: "white" | "alpha" }[] = [];
  for (const dir of [ICONS_DIR, path.join(ICONS_DIR, "client")]) {
    for (const name of fs.readdirSync(dir)) {
      if (/^icon-\d+x\d+\.png$/.test(name)) {
        out.push({ file: path.join(dir, name), glyph: "white" });
      }
    }
  }
  for (const name of fs.readdirSync(ICONS_DIR)) {
    if (/^badge-\d+x\d+\.png$/.test(name)) {
      out.push({ file: path.join(ICONS_DIR, name), glyph: "alpha" });
    }
  }
  return out;
}

/**
 * Icon paths declared by static files, whatever the quoting style.
 *
 * The image extension is required. The assertion built on this is "every referenced icon
 * exists", and without that requirement a bare directory prefix — the service worker lists
 * one to know which requests to cache — would be satisfied by the directory itself.
 */
function referencedIconPaths(source: string): string[] {
  return [...source.matchAll(/["'`](\/icons\/[^"'`\s]+\.(?:png|svg))["'`]/g)].map(
    (match) => match[1],
  );
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

  it("the test notification reuses the real client notification assets", () => {
    // These paths are duplicated from `public/sw-client.js`, which cannot import from
    // `src`. A silent divergence would make the test button prove the wrong thing, so the
    // copies are checked against the same files.
    const serviceWorker = fs.readFileSync(SERVICE_WORKER, "utf8");
    const swIcon = serviceWorker.match(/icon:\s*["'`]([^"'`]+)["'`]/)?.[1];
    const swBadge = serviceWorker.match(/badge:\s*["'`]([^"'`]+)["'`]/)?.[1];

    expect(CLIENT_NOTIFICATION_ICON).toBe(swIcon);
    expect(NOTIFICATION_BADGE).toBe(swBadge);

    for (const reference of [CLIENT_NOTIFICATION_ICON, NOTIFICATION_BADGE]) {
      expect(fs.existsSync(absolute(reference))).toBe(true);
      expect(isPng(absolute(reference))).toBe(true);
    }
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

  it("draws every icon glyph with paths, never with text", () => {
    // This is the root cause of the black-blob icons: `sharp` rasterises SVG through
    // librsvg, which ships no colour emoji font, so a `<text>` car emoji rendered as a
    // solid black silhouette (measured: 25 % of the canvas was opaque `0,0,0`). A
    // font-dependent glyph is not portable, whatever it looks like in a browser.
    const offenders = iconSourceFiles().filter((file) =>
      /<text[\s>]/.test(fs.readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });

  it("paints every icon with the design-system gradient, not a flat fill", () => {
    // The blue pair is literally `.btn-gradient` / `LANDING_CTA` in the app
    // (`from-blue-600 to-blue-800`); the driver keeps its own emerald equivalent. Pinning
    // both stops means an icon can neither fall back to a single flat colour nor drift to
    // an off-brand shade.
    const expected = [
      { dir: "client", stops: ["#2563eb", "#1e40af"] },
      { dir: "", stops: ["#10b981", "#047857"] },
    ];

    for (const { dir, stops } of expected) {
      const svg = fs.readFileSync(
        path.join(PUBLIC_DIR, "icons", dir, "icon-192x192.svg"),
        "utf8",
      );

      // The background must actually *paint* with the gradient. Asserting only that a
      // `<linearGradient>` is declared is vacuous: a flat `fill="#2563eb"` left next to an
      // unused definition passes that, which is how the first version of this test missed
      // the very regression it was written for (found by mutation, not by reading).
      expect(svg).toMatch(/fill="url\(#[A-Za-z0-9_-]+\)"/);
      for (const stop of stops) {
        expect(svg).toContain(`stop-color="${stop}"`);
      }
    }
  });

  it("rasterises every icon centred, with a margin and no black-blob glyph", async () => {
    // Guards the two defects the generator fixes by measurement, so a hand-edited SVG
    // cannot reintroduce them silently:
    // - the glyph must sit on the canvas centre (the emoji was +13 px right, +6.5 px down
    //   on a 192 px icon);
    // - it must leave a margin, so Android's icon mask does not crop it;
    // - no opaque black: that is what a missing font produces.
    const offenders: string[] = [];

    for (const { file, glyph } of rasterFiles()) {
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({
        resolveWithObject: true,
      });
      const channels = info.channels;
      const isGlyph = glyph === "white"
        ? (r: number, g: number, b: number) => r > 200 && g > 200 && b > 200
        : (_r: number, _g: number, _b: number, a: number) => a > 40;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let black = 0;
      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
          const i = (y * info.width + x) * channels;
          const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
          if (a > 200 && r < 12 && g < 12 && b < 12) black += 1;
          if (!isGlyph(r, g, b, a)) continue;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }

      const label = path.relative(PROJECT_ROOT, file);
      if (minX === Infinity) {
        offenders.push(`${label}: glyph not found`);
        continue;
      }
      if (black / (info.width * info.height) > 0.01) {
        offenders.push(`${label}: ${((100 * black) / (info.width * info.height)).toFixed(1)}% opaque black`);
      }

      // A pixel index is a box corner, so the drawn box ends half a pixel past `maxX`:
      // compare the geometric centres, otherwise a centred glyph reads as 0.5 px off.
      const centreX = (minX + maxX + 1) / 2;
      const centreY = (minY + maxY + 1) / 2;
      const mid = info.width / 2;
      if (Math.abs(centreX - mid) > 1 || Math.abs(centreY - mid) > 1) {
        offenders.push(`${label}: off-centre by (${(centreX - mid).toFixed(1)}, ${(centreY - mid).toFixed(1)})px`);
      }
      if ((maxX - minX + 1) / info.width > 0.9 || (maxY - minY + 1) / info.height > 0.9) {
        offenders.push(`${label}: glyph reaches the canvas edge`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps the installed app name as the full brand name", () => {
    // The manifest name is the only place the installed app's name can be set, and that
    // name is what Android shows as the sender of a notification. It read "Elegance
    // Mobility" / "Elegance Driver" — two variants of a brand that exists nowhere else,
    // and neither of them the product's actual name.
    const names = manifestFiles().map(([name, json]) => [name, json.name]);

    expect(names).toEqual([
      ["manifest-client.json", "Vector Elegans"],
      ["manifest.json", "Vector Elegans"],
    ]);
    expect(readJson(path.join(PUBLIC_DIR, "manifest-client.json")).short_name).toBe(
      "Vector Elegans",
    );
  });

  it("makes the landing page installable by linking a manifest", () => {
    // Without this the landing has no app for the browser to offer, and the footer's
    // install invitation would have nothing to trigger.
    const source = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/app/page.tsx"),
      "utf8",
    );

    expect(source).toContain('manifest: "/manifest-client.json"');
  });

  it("references every generated PNG from a manifest or the service worker", () => {
    // Six unreferenced sizes used to ship (72, 96, 128, 144, 152, 384) — dead weight that
    // had to be regenerated with every artwork change, and one of them was referenced only
    // by a service worker that was never registered. A size that no consumer declares is
    // noise, so the generator only emits what is declared.
    const referenced = new Set<string>([
      ...manifestFiles().flatMap(([, json]) => manifestIconSources(json)),
      ...referencedIconPaths(fs.readFileSync(SERVICE_WORKER, "utf8")),
      ...referencedIconPaths(
        fs.readFileSync(
          path.join(PROJECT_ROOT, "src/lib/services/testNotification.ts"),
          "utf8",
        ),
      ),
    ]);

    const orphans: string[] = [];
    for (const dir of [path.join(PUBLIC_DIR, "icons"), path.join(PUBLIC_DIR, "icons/client")]) {
      for (const name of fs.readdirSync(dir)) {
        if (!name.endsWith(".png")) continue;
        const reference = `/icons/${path.relative(path.join(PUBLIC_DIR, "icons"), path.join(dir, name))}`;
        if (!referenced.has(reference)) orphans.push(`${dir}:${name}`);
      }
    }

    expect(orphans).toEqual([]);
  });
});
