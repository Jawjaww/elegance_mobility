/**
 * Generates the raster icon sets from the committed SVG sources.
 *
 * Two defects in the previous version of this file are fixed here:
 * - it claimed to write PNGs but wrote SVG files, so `icon-192x192.png` (referenced
 *   by `sw-client.js` and the manifests) was served as a 404 in production;
 * - it wrote into the process working directory instead of the icons folder, so
 *   running it from the repo root polluted the root.
 *
 * Two sets are produced, one per audience: the driver app is green (`#10b981`) and the
 * client portal is blue (`#2563eb`, the portal's `theme_color`). Serving the driver's
 * green icon to a client who installs the portal is a visible brand mismatch, so each
 * manifest points at its own set. The set is defined by the SVGs present in a
 * directory — adding a size means adding its SVG.
 *
 * The notification `badge` is generated once, at the root: Android keeps only the
 * alpha channel of that image, so it must be a white silhouette on a transparent
 * background. A full-colour icon renders as a plain white blob in the status bar, and
 * a silhouette carries no brand colour — hence a single shared badge.
 *
 * Run from the `elegance-mobilite` root: `node public/icons/generate-icons.js`.
 * Requires `sharp`, which Next.js already ships for image optimisation.
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ICON_ROOT = __dirname;
/** Directories whose `icon-<size>x<size>.svg` files get rasterized next to them. */
const ICON_DIRS = [ICON_ROOT, path.join(ICON_ROOT, "client")];
const BADGE_SIZE = 72;
/** Rasterisation density, so the vector glyph is crisp before downscaling. */
const RENDER_DENSITY = 384;
const CAR = String.fromCodePoint(0x1f697);

/** Sizes declared by the SVGs in `dir`, e.g. `icon-192x192.svg` -> 192. */
function sizesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .flatMap((name) => {
      const match = /^icon-(\d+)x\d+\.svg$/.exec(name);
      return match ? [Number(match[1])] : [];
    })
    .sort((a, b) => a - b);
}

async function rasterizeIcons(dir, sizes) {
  for (const size of sizes) {
    await sharp(fs.readFileSync(path.join(dir, `icon-${size}x${size}.svg`)), {
      density: RENDER_DENSITY,
    })
      .resize(size, size)
      .png()
      .toFile(path.join(dir, `icon-${size}x${size}.png`));
  }
}

async function rasterizeBadge() {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_SIZE}" height="${BADGE_SIZE}" viewBox="0 0 100 100">` +
      `<text x="50" y="68" font-size="55" text-anchor="middle" fill="#ffffff">${CAR}</text></svg>`,
  );

  await sharp(svg, { density: RENDER_DENSITY })
    .resize(BADGE_SIZE, BADGE_SIZE)
    .png()
    .toFile(path.join(ICON_ROOT, `badge-${BADGE_SIZE}x${BADGE_SIZE}.png`));
}

async function main() {
  let written = 0;
  for (const dir of ICON_DIRS) {
    const sizes = sizesIn(dir);
    await rasterizeIcons(dir, sizes);
    written += sizes.length;
    console.log(`${path.relative(ICON_ROOT, dir) || "."}: ${sizes.join(", ") || "(none)"}`);
  }
  await rasterizeBadge();
  written += 1;

  console.log(`Generated ${written} PNG icons under ${ICON_ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
