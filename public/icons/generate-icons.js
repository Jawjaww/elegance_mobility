/**
 * Generates the icon SVG sources and their raster PNGs.
 *
 * ## Why the artwork is a vector glyph and not an emoji
 *
 * The previous version drew a car emoji with `<text>`. `sharp` rasterises SVG through
 * librsvg, which ships **no colour emoji font**: the glyph was rendered as a solid
 * **black silhouette**. Measured on the committed PNGs: 25 % of the canvas was opaque
 * black (`0,0,0,255`) instead of a car. A font-dependent glyph is therefore not a
 * cosmetic risk — it silently renders as a blob wherever the font is missing. The
 * artwork is now plain paths, which every renderer draws identically.
 *
 * ## Why the centring is computed instead of written by hand
 *
 * The emoji was also off-centre: its glyph box sat +13 px right and +6.5 px down of the
 * canvas centre on a 192 px icon. Rather than nudging magic numbers, this script
 * **measures** the glyph once at raster time and derives the transform that puts its
 * bounding box exactly on the canvas centre — so the placement cannot drift when the
 * glyph or the stroke width changes.
 *
 * ## One definition, two audiences
 *
 * The driver app and the client portal each get their own set, from the same glyph and
 * the same geometry: only the palette differs (green `#10b981`, blue `#2563eb`, each
 * matching its manifest's `theme_color`). The colours are the app's design-system
 * gradient — the `from-blue-600 to-blue-800` pair of `.btn-gradient` in `globals.css`
 * for the client, its emerald equivalent for the driver. Serving the driver's green
 * icon to a client who installs the portal is a visible brand mismatch.
 *
 * The SVGs are written by this script rather than hand-maintained: eight copies of the
 * same 223-byte file previously had to be edited together, which is how one of them gets
 * forgotten. Here there is a single glyph and a single size list.
 *
 * Run from the `elegance-mobilite` root: `node public/icons/generate-icons.js`.
 * Requires `sharp`, which Next.js already ships for image optimisation.
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ICON_ROOT = __dirname;
/** Canvas the artwork is laid out in; every generated SVG uses it as its `viewBox`. */
const VIEW_BOX = 100;
/** Rasterisation density, so the vector glyph is crisp before downscaling. */
const RENDER_DENSITY = 384;

/**
 * Which sizes are worth generating: exactly those a consumer declares. `manifest.json`
 * and `manifest-client.json` declare 192 and 512 (Chrome's installability minimum), and
 * `sw-client.js` uses the 72 px badge for the status bar.
 */
const ICON_SIZES = [192, 512];
const BADGE_SIZE = 72;

/**
 * Fraction of the canvas the glyph's bounding box occupies.
 *
 * The icon keeps a generous margin: Android masks installed icons to its own shape and
 * crops a plain square, so artwork reaching the edges gets its corners cut off. The badge
 * sits in the status bar and is scaled down hard, where a larger glyph stays legible.
 */
const ICON_GLYPH_WIDTH = 0.62;
const BADGE_GLYPH_WIDTH = 0.86;

/**
 * Palettes, per audience. `from`/`to` mirror the design-system gradients: the client pair
 * is literally `.btn-gradient`'s `from-blue-600 to-blue-800`.
 */
const PALETTES = {
  driver: { from: "#10b981", to: "#047857" },
  client: { from: "#2563eb", to: "#1e40af" },
};

/** Sets to write, relative to this folder. `null` palette means the monochrome badge. */
const SETS = [
  { dir: ICON_ROOT, palette: PALETTES.driver },
  { dir: path.join(ICON_ROOT, "client"), palette: PALETTES.client },
];

/**
 * Lucide's `car`, in its native 24x24 box, drawn as strokes.
 *
 * Strokes rather than a filled silhouette: the project already draws every other icon
 * with Lucide via `lucide-react`, so the notification icon matches the in-app icon
 * language instead of introducing a new illustrative style.
 */
const GLYPH_BOX = 24;
const GLYPH_STROKE = 2;
const GLYPH_PATHS = [
  'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9c-.2.4-.2.9-.1 1.3l.1.4c0 .6.4 1 1 1h1',
  'M9 17h6',
];

/** The glyph as SVG, wrapped in the transform this script computed. */
function glyphGroup(transform, stroke) {
  const parts = GLYPH_PATHS.map((d) => `<path d="${d}"/>`).join("");
  const wheels = '<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>';
  return (
    `<g transform="${transform}" fill="none" stroke="${stroke}"` +
    ` stroke-width="${GLYPH_STROKE}" stroke-linecap="round" stroke-linejoin="round">` +
    `${parts}${wheels}</g>`
  );
}

/**
 * Bounding box of the drawn glyph, in the 24x24 box, **including the stroke**.
 *
 * Measured from a real rasterisation rather than derived from the path data: parsing the
 * curves and then re-adding the stroke is exactly the kind of arithmetic that silently
 * ends up a few percent off, which is the defect being fixed.
 */
async function measureGlyph() {
  const PAD = 6;
  const SCALE = 8;
  const canvas = GLYPH_BOX + 2 * PAD;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas * SCALE}"` +
    ` height="${canvas * SCALE}" viewBox="0 0 ${canvas} ${canvas}">` +
    glyphGroup(`translate(${PAD} ${PAD})`, "#000000") +
    `</svg>`;

  const { data, info } = await sharp(Buffer.from(svg), { density: RENDER_DENSITY })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + (info.channels - 1)];
      if (alpha <= 40) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (minX === Infinity) {
    throw new Error("glyph rendered empty — check GLYPH_PATHS");
  }

  // `density` scales the rasterisation, so the image is not `canvas * SCALE` pixels wide.
  // Deriving the ratio from the real output keeps the measurement independent of it.
  const pxPerUnit = info.width / canvas;
  const toUnits = (value) => value / pxPerUnit - PAD;
  return {
    minX: toUnits(minX),
    minY: toUnits(minY),
    // `maxX` is an index, so the box is half a device pixel wider than the index span.
    maxX: toUnits(maxX + 1),
    maxY: toUnits(maxY + 1),
  };
}

/** Transform placing the glyph's bounding box on the canvas centre, at `width` fraction. */
function centringTransform(box, widthFraction) {
  const width = box.maxX - box.minX;
  const scale = (widthFraction * VIEW_BOX) / width;
  const centreX = (box.minX + box.maxX) / 2;
  const centreY = (box.minY + box.maxY) / 2;
  const round = (value) => Number(value.toFixed(4));
  return `translate(${round(VIEW_BOX / 2 - scale * centreX)} ${round(
    VIEW_BOX / 2 - scale * centreY,
  )}) scale(${round(scale)})`;
}

/**
 * Full-bleed square rather than a rounded rectangle: the OS masks installed icons to its
 * own shape, and a pre-rounded background leaves transparent corners a mask then crops
 * into visible notches.
 */
function iconSvg(size, palette, transform) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
    ` viewBox="0 0 ${VIEW_BOX} ${VIEW_BOX}">\n` +
    `  <defs>\n` +
    `    <linearGradient id="veGradient" x1="0" y1="0" x2="1" y2="0">\n` +
    `      <stop offset="0" stop-color="${palette.from}"/>\n` +
    `      <stop offset="1" stop-color="${palette.to}"/>\n` +
    `    </linearGradient>\n` +
    `  </defs>\n` +
    `  <rect width="${VIEW_BOX}" height="${VIEW_BOX}" fill="url(#veGradient)"/>\n` +
    `  ${glyphGroup(transform, "#ffffff")}\n` +
    `</svg>\n`
  );
}

/** Transparent background: Android keeps only the alpha channel of the badge. */
function badgeSvg(size, transform) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
    ` viewBox="0 0 ${VIEW_BOX} ${VIEW_BOX}">\n` +
    `  ${glyphGroup(transform, "#ffffff")}\n` +
    `</svg>\n`
  );
}

async function rasterize(svg, size, target) {
  await sharp(Buffer.from(svg), { density: RENDER_DENSITY })
    .resize(size, size)
    .png()
    .toFile(target);
}

async function main() {
  const box = await measureGlyph();
  const iconTransform = centringTransform(box, ICON_GLYPH_WIDTH);
  const badgeTransform = centringTransform(box, BADGE_GLYPH_WIDTH);

  let written = 0;
  for (const { dir, palette } of SETS) {
    fs.mkdirSync(dir, { recursive: true });
    for (const size of ICON_SIZES) {
      const svg = iconSvg(size, palette, iconTransform);
      // The SVG is committed as the reviewable source and the PNG as the shipped asset,
      // both regenerated here so they can never disagree.
      fs.writeFileSync(path.join(dir, `icon-${size}x${size}.svg`), svg);
      await rasterize(svg, size, path.join(dir, `icon-${size}x${size}.png`));
      written += 1;
    }
    console.log(`${path.relative(ICON_ROOT, dir) || "."}: ${ICON_SIZES.join(", ")}`);
  }

  const badge = badgeSvg(BADGE_SIZE, badgeTransform);
  fs.writeFileSync(path.join(ICON_ROOT, "badge.svg"), badge);
  await rasterize(badge, BADGE_SIZE, path.join(ICON_ROOT, `badge-${BADGE_SIZE}x${BADGE_SIZE}.png`));
  written += 1;

  console.log(`Generated ${written} icons from one glyph under ${ICON_ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
