import fs from "fs";
import path from "path";

/**
 * Guards the Brave case on both install surfaces.
 *
 * Brave offers `beforeinstallprompt` and then fails the install, with its own "impossible
 * d'installer cet appli". Nothing in `Page.getInstallabilityErrors` reports that: the manifest
 * is valid, the icons match their declared sizes, and the service worker has a fetch handler —
 * measured on the deployed build. The limit is Brave's, which has no WebAPK minting server
 * (`web.dev/learn/pwa/installation`; `brave-browser#7357`), so no manifest change can fix it.
 *
 * What we control is not inviting it. Two things must hold: the copy must be shared rather
 * than rewritten per surface, and the direct tap must be refused. Both are source-level
 * assertions, like `landingInstallInvite.test.ts`: this repository has no component-rendering
 * setup (no `@testing-library/react`), and where the copy lives is the thing being pinned.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const LANDING = path.join(PROJECT_ROOT, "src/components/landing/LandingInstallInvite.tsx");
const CARD = path.join(PROJECT_ROOT, "src/components/account/ClientInstallCard.tsx");

/** Source with runs of whitespace collapsed, since JSX wraps a sentence across lines freely. */
function readSource(file: string): string {
  return fs.readFileSync(file, "utf8").replace(/\s+/g, " ");
}

describe("Brave install guidance", () => {
  it("renders the shared constant on both install surfaces", () => {
    // The same correction path written twice is how the blocked-notification guidance drifted,
    // with only one copy ever corrected. Both surfaces must read the one constant.
    expect(readSource(LANDING)).toContain("{BRAVE_INSTALL_GUIDANCE}");
    expect(readSource(CARD)).toContain("{BRAVE_INSTALL_GUIDANCE}");
  });

  it("spells the guidance out nowhere, so a rewording cannot fork it", () => {
    // Fragments unique to the constant, not the whole sentence: a component that re-typed the
    // advice with slightly different wording is the failure this is meant to catch. They are
    // picked to avoid the words both components already use for other reasons — `ClientInstallCard`
    // says "réglages de notifications" and "fenêtres flottantes" in its installed state, so
    // those would match a healthy file and measure nothing.
    const fragments = ["ne peut pas ajouter", "Passez par Chrome", "opération échoue"];

    for (const file of [LANDING, CARD]) {
      const source = readSource(file).toLowerCase();
      const leaked = fragments.filter((fragment) => source.includes(fragment.toLowerCase()));

      expect(leaked).toEqual([]);
    }
  });

  it("refuses the direct tap on Brave in the landing dialog", () => {
    // The dialog shows the menu directions *and* the button side by side, so it cannot rely on
    // an early return: the button needs the shared predicate, with Brave passed in.
    expect(readSource(LANDING)).toMatch(/shouldOfferDirectInstall\(\s*state,\s*isBrave\s*\)/);
  });

  it("takes the Brave branch before the promptable one in the account card", () => {
    // Order is the guarantee here: the card returns early, and a Brave browser reports
    // `promptable` (the event fires), so a branch placed after it would never be reached and
    // the button would re-appear.
    const source = readSource(CARD);
    const braveAt = source.indexOf("if (isBrave)");
    const promptableAt = source.indexOf('if (state === "promptable")');

    expect(braveAt).toBeGreaterThanOrEqual(0);
    expect(promptableAt).toBeGreaterThan(braveAt);
  });

  it("still lets an already-installed Brave user see the installed state", () => {
    // A Brave user who installed from Chrome *is* installed. The Brave branch must not swallow
    // that message, or the card would tell an installed user their browser cannot install.
    const source = readSource(CARD);

    expect(source.indexOf('if (state === "installed")')).toBeLessThan(
      source.indexOf("if (isBrave)"),
    );
  });
});
