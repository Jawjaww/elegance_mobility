import fs from "fs";
import path from "path";

/**
 * Guards the icon lookup on the option tiles.
 *
 * `optionIcon` picks a pictogram by substring match on the option name and falls back to
 * `Sparkles` when nothing matches — silently, which is how "Animaux domestiques" spent its life
 * showing a sparkle. The French plural is the trap: "animaux" does not contain the singular
 * "animal" (the plural ends in -aux, not -al), so the rule written for animals never fired.
 *
 * The invariant below is what keeps that fallback honest: every option name the product ships
 * has to match at least one rule, so a catalog addition nobody wired up fails here instead of
 * going live with a generic sparkle. The names come from `SHORT_LABELS`, the same table the
 * tiles take their labels from, rather than a second copy that could drift from it.
 *
 * Source-level assertions, as elsewhere in this folder: `optionIcon` is private to the component
 * and the repository has no component-rendering setup.
 */
const OPTIONS = path.resolve(
  __dirname,
  "../components/reservation/ReservationOptionsToggles.tsx",
);

/**
 * Comments are stripped before the lists are parsed: the file explains the plural fix by naming
 * the very strings the matcher list is read from, so a surviving comment would pollute it.
 * Unlike the other helpers in this folder, whitespace is kept — the blocks are delimited by
 * line-leading braces.
 */
function readSource(file: string): string {
  return fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, " ");
}

/** The option names the product ships, taken from the label table the tiles render from. */
function shippedOptionNames(source: string): string[] {
  const block = source.match(/const SHORT_LABELS[\s\S]*?\n\};/);
  if (!block) return [];
  return [...block[0].matchAll(/"([^"]+)":\s*"/g)].map((match) => match[1]);
}

/** The substrings `optionIcon` actually tests. */
function iconMatchers(source: string): string[] {
  const body = source.match(/function optionIcon[\s\S]*?\n\}/);
  if (!body) return [];
  return [...body[0].matchAll(/includes\("([^"]+)"\)/g)].map((match) => match[1]);
}

describe("option tile icons", () => {
  const source = readSource(OPTIONS);

  it("reads both lists out of the component", () => {
    // Non-vacuity: every assertion below is a loop over these two, so an empty or short list
    // would let them pass without testing anything.
    expect(shippedOptionNames(source).length).toBeGreaterThanOrEqual(5);
    expect(iconMatchers(source).length).toBeGreaterThanOrEqual(5);
    // `includes("accueil")` is what proves the matcher list is the real one, not a stray match.
    expect(iconMatchers(source)).toContain("accueil");
  });

  it("matches at least one rule for every option the product ships", () => {
    const matchers = iconMatchers(source);

    const unmatched = shippedOptionNames(source).filter((name) => {
      const lower = name.toLowerCase();
      return !matchers.some((matcher) => lower.includes(matcher));
    });

    // An option that matches nothing does not fail loudly: it renders the generic fallback.
    expect(unmatched).toEqual([]);
  });

  it("covers the plural the singular rule misses", () => {
    // The defect, stated as the comparison that hid it: the shipped name contains "animaux" and
    // never "animal", so a rule written on the singular cannot fire.
    const shipped = "Animaux domestiques".toLowerCase();
    expect(shipped).not.toContain("animal");
    expect(shipped).toContain("animaux");

    const matchers = iconMatchers(source);
    expect(matchers.some((matcher) => shipped.includes(matcher))).toBe(true);
  });
});
