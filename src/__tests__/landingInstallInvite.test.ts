import fs from "fs";
import path from "path";

/**
 * Guards the landing footer against the install-invitation regression that broke it.
 *
 * The landing is a stack of full-viewport snap panels, and this footer is pinned to the
 * last one, which is `h-[100svh] overflow-hidden`. Adding the menu directions as visible
 * text therefore did not push the page — it clipped the bottom of the panel on a phone,
 * where `100svh` is already reduced by the visible browser chrome. Measured on the
 * deployed build at 390x844: the footer had doubled to 208px and the last panel's content
 * needed 694px. The instructions belong in a dialog, where they cost the footer nothing.
 *
 * Source-level assertions rather than a render: the fix is about *where the copy lives*,
 * and this repository has no component-rendering setup (no `@testing-library/react`).
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const FOOTER = path.join(PROJECT_ROOT, "src/components/landing/LandingFooter.tsx");
const INVITE = path.join(PROJECT_ROOT, "src/components/landing/LandingInstallInvite.tsx");

/**
 * The copy that overflowed the panel, and the two platforms it names. Kept as fragments so
 * a rewording does not silently disarm the test: it asserts the directions are *absent*
 * from the footer, which is the actual regression.
 */
const INSTRUCTIONS = ["Menu du navigateur", "écran d&apos;accueil", "Sur Android", "Sur iPhone"];

/**
 * Source with runs of whitespace collapsed to single spaces. JSX wraps a sentence across
 * lines freely, so a contiguous phrase is not necessarily a contiguous slice of the file —
 * without this, the test fails on formatting rather than on meaning.
 */
function readSource(file: string): string {
  return fs.readFileSync(file, "utf8").replace(/\s+/g, " ");
}

describe("landing install invitation", () => {
  it("keeps the menu directions out of the footer", () => {
    const footer = readSource(FOOTER);

    const leaked = INSTRUCTIONS.filter((fragment) => footer.includes(fragment));

    expect(leaked).toEqual([]);
  });

  it("shows the menu directions in the dialog instead", () => {
    const invite = readSource(INVITE);

    // Non-vacuity: if the directions move again, they must not simply vanish.
    const missing = INSTRUCTIONS.filter((fragment) => !invite.includes(fragment));

    expect(missing).toEqual([]);
    expect(invite).toContain("DialogContent");
  });

  it("still reaches the invitation from the footer", () => {
    // The directions were moved out, not the feature: a footer that no longer rendered the
    // invitation would pass the tests above while removing the install entry altogether.
    // Matched on the JSX element, not the bare name: the `import` line contains the name
    // too, so a name-only check stayed green with the component unrendered (found by
    // mutation, not by reading).
    expect(readSource(FOOTER)).toContain("<LandingInstallInvite");
  });
});
