import fs from "fs";
import path from "path";

/**
 * Guards against the mobile "scrolls for nothing" page.
 *
 * `100vh` is the viewport height *without* the mobile address bar, so a `min-h-screen` shell
 * is always a few dozen pixels taller than what the user can see: a page whose content fits
 * still scrolls by exactly the height of the browser chrome, revealing nothing. This was
 * reported on the notifications page and on the reservation confirmation, and it applied to
 * every short page in the client portal. `dvh` follows the visible viewport.
 *
 * Scope, deliberately: the client shell (`body`, `ClientLayout`, the my-account pass-through
 * layout) and the confirmation page that nested a second viewport inside the shell. Other
 * trees are untouched — `AuthGuard`, the driver portal and the backoffice have their own
 * layout intent, and `rates/page.tsx` is a legacy page whose content is taller than the
 * screen regardless, so a missing `min-h-screen` would change nothing there.
 *
 * Source-level assertions, like `braveInstallGuidance.test.ts`: this repository has no
 * component-rendering setup, and the offending class is the thing being pinned.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const ROOT_LAYOUT = path.join(PROJECT_ROOT, "src/app/layout.tsx");
const CLIENT_LAYOUT = path.join(PROJECT_ROOT, "src/components/layout/ClientLayout.tsx");
const ACCOUNT_LAYOUT = path.join(PROJECT_ROOT, "src/app/(client-portal)/my-account/layout.tsx");
const SUCCESS_PAGE = path.join(
  PROJECT_ROOT,
  "src/app/(client-portal)/my-account/reservations/reservation-success/page.tsx",
);

/** Comments removed in a single pass, block form first, so that a block opener typed inside a
 * line comment cannot open a phantom block and swallow the code that follows. Whitespace is
 * then collapsed. Comments must go before the assertions because these very files explain the
 * fix by naming `min-h-screen`. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, " ");
}

/** Source with comments removed and runs of whitespace collapsed. */
function readSource(file: string): string {
  return stripComments(fs.readFileSync(file, "utf8")).replace(/\s+/g, " ");
}

describe("client portal viewport height", () => {
  it("sizes the document against the visible viewport, not 100vh", () => {
    const source = readSource(ROOT_LAYOUT);

    expect(source).toContain("min-h-[100dvh]");
    expect(source).not.toContain("min-h-screen");
  });

  it("sizes the client shell against the visible viewport, not 100vh", () => {
    const source = readSource(CLIENT_LAYOUT);

    expect(source).toContain("min-h-[100dvh]");
    expect(source).not.toContain("min-h-screen");
  });

  it("makes the shell a flex column, so its own flex-1 child can grow", () => {
    // Without `flex` on the shell, the `flex-1` on `main` is inert (a flex-1 child of a
    // display:block parent grows to nothing), and `flex-1` on a page would silently do nothing.
    const source = readSource(CLIENT_LAYOUT);

    expect(source).toMatch(/className="flex min-h-\[100dvh\] flex-col/);
    expect(source).toMatch(/<main className="flex flex-1 flex-col"/);
  });

  it("lets a page fill the space between the header and the bottom nav", () => {
    expect(readSource(ACCOUNT_LAYOUT)).toMatch(/className="flex flex-1 flex-col/);
  });

  it("does not stack a second viewport inside the shell on the confirmation page", () => {
    // This is the page the user reported as scrolling far more than the others: a
    // `min-h-screen` block nested inside the shell added a whole viewport on top of the header
    // and the nav clearance, instead of taking the space that was left.
    const source = readSource(SUCCESS_PAGE);

    expect(source).not.toContain("min-h-screen");
    expect(source).toMatch(/className="flex flex-1 items-center justify-center/);
  });
});
