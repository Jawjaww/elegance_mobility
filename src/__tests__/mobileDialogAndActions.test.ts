import fs from "fs";
import path from "path";

/**
 * Guards the mobile usability of the backoffice dialogs and action rows.
 *
 * The reported failure was concrete: with the on-screen keyboard open, the dialog "Remettre ce
 * dossier en vérification" stayed centred and its reason field and confirm button ended up
 * *underneath* the keyboard. Two independent causes had to be addressed, and they are pinned
 * separately here because fixing one without the other leaves the dialog unusable:
 *
 * 1. `DialogContent` was centred on every screen (`top-1/2 -translate-y-1/2`). Centring is the
 *    desktop convention, but it puts the lower half of a dialog exactly where the keyboard
 *    opens. The dialog is now anchored to the top below `sm`, and the centring is scoped to
 *    `sm:` so the desktop layout is untouched.
 * 2. A centred layout alone would still be recoverable if `dvh` tracked the keyboard, but on
 *    Android Chrome it does not: the default `interactive-widget: resizes-visual` shrinks only
 *    the visual viewport, and `dvh` resolves against the layout viewport. `interactiveWidget`
 *    in the root layout is what makes the height unit honest.
 *
 * The action rows are the second half of the report: several buttons wrapped onto one line on a
 * phone, squeezing the labels. They stack full width below `sm`.
 *
 * Source-level assertions, like `viewportHeight.test.ts`: this repository has no
 * component-rendering setup, and the offending classes are what is being pinned.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const ROOT_LAYOUT = path.join(PROJECT_ROOT, "src/app/layout.tsx");
const DIALOG = path.join(PROJECT_ROOT, "src/components/ui/dialog.tsx");
const DRIVER_FOLDER_ADMIN = path.join(
  PROJECT_ROOT,
  "src/components/admin/drivers/DriverFolderAdmin.tsx",
);

/** Comments removed in a single pass, block form first, so that a block opener typed inside a
 * line comment cannot open a phantom block and swallow the code that follows. Whitespace is
 * then collapsed. Comments must go before the assertions because these very files explain the
 * fix by naming the classes involved. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, " ");
}

/** Source with comments removed and runs of whitespace collapsed. */
function readSource(file: string): string {
  return stripComments(fs.readFileSync(file, "utf8")).replace(/\s+/g, " ");
}

/** The slice between two markers, so an assertion cannot be satisfied by a match elsewhere in
 * the file. The closing marker is searched after the opening one, because the same identifier
 * often appears earlier in the file (the `DialogClose` alias, for instance). */
function slice(source: string, from: string, to: string): string {
  const start = source.indexOf(from);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf(to, start + from.length);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

/**
 * Every unconditional vertical centring in `source`: a `top-1/2` or `-translate-y-1/2` that is
 * not already scoped to `sm:`. That pair is what kept the dialog centred in front of the
 * keyboard.
 *
 * The lookbehind is the whole point: asserting the pair is simply *absent* would also pass on a
 * source where the centring moved somewhere unexpected, so what is forbidden is the unscoped
 * form specifically, not the classes themselves — the desktop form keeps them, prefixed.
 */
function unscopedVerticalCentring(source: string): string[] {
  return [
    ...(source.match(/(?<!sm:)top-1\/2/g) ?? []),
    ...(source.match(/(?<!sm:)-translate-y-1\/2/g) ?? []),
  ];
}

describe("the layout viewport follows the keyboard", () => {
  // Without this, a dialog anchored to the bottom of `dvh` stays precisely where the keyboard
  // covers it: `dvh` is resolved against the layout viewport, which Android Chrome leaves at
  // its full height unless the page asks for `resizes-content`.
  it("asks the browser to resize the layout viewport", () => {
    expect(readSource(ROOT_LAYOUT)).toContain(
      'interactiveWidget: "resizes-content"',
    );
  });
});

describe("the dialog is anchored above the keyboard on a phone", () => {
  const content = () =>
    slice(readSource(DIALOG), "const DialogContent", "DialogPrimitive.Close");

  it("no longer centres itself on every screen", () => {
    expect(unscopedVerticalCentring(content())).toHaveLength(0);
  });

  it("anchors to the top and bounds its height on the visible viewport", () => {
    const source = content();
    expect(source).toContain("top-4");
    // `translate-y-0` overrides the inherited `-translate-y-1/2`: without it the dialog would be
    // pulled half its own height above the top edge.
    expect(source).toContain("translate-y-0");
    expect(source).toContain("max-h-[calc(100dvh-2rem)]");
  });

  it("keeps the centring, and nothing but the centring, for the desktop breakpoint", () => {
    const source = content();
    expect(source).toContain("sm:top-1/2");
    expect(source).toContain("sm:-translate-y-1/2");
    // The entry/exit motion has to stay coherent with the new resting position: the vertical
    // part is scoped to `sm` alongside the centring, otherwise `sm` would slide in from the
    // mobile offset.
    expect(source).toMatch(/sm:data-\[state=open\]:slide-in-from-top-\[48%\]/);
    expect(source).toMatch(/sm:data-\[state=closed\]:slide-out-to-top-\[48%\]/);
    expect(source).toContain(
      "data-[state=open]:slide-in-from-top-4",
    );
  });

  // Non-vacuity: the detector must recognise the exact pair this change removed, or the first
  // assertion of this block would pass on any source at all.
  it("detects the centring it forbids", () => {
    expect(
      unscopedVerticalCentring('"fixed left-1/2 top-1/2 -translate-y-1/2"'),
    ).toHaveLength(2);
    expect(
      unscopedVerticalCentring('"sm:top-1/2 sm:-translate-y-1/2"'),
    ).toHaveLength(0);
  });
});

describe("the dialog footer is usable with a thumb", () => {
  const footer = () =>
    slice(readSource(DIALOG), "const DialogFooter", "DialogFooter.displayName");

  it("spaces the stacked buttons", () => {
    const source = footer();
    // `sm:space-x-2` only spaces the horizontal axis, so the stacked form had its buttons
    // flush against each other. A row gap is the vertical spacing of the stacked column and
    // is inert once `sm:flex-row` puts the buttons on a single line: that is why no `sm:`
    // reset is needed, and why a plain `gap-2` was rejected — it shares a merge group with the
    // `gap-*` a caller may pass, so the reset would have won over the caller's own gap.
    expect(source).toContain("gap-y-2");
    expect(source).not.toContain("gap-2");
    // The desktop spacing has to stay exactly what it was before the mobile gap was added.
    expect(source).toContain("sm:space-x-2");
    expect(source).not.toContain("sm:gap-");
  });

  it("stretches the actions on a phone only", () => {
    const source = footer();
    expect(source).toContain("[&>button]:w-full");
    expect(source).toContain("sm:[&>button]:w-auto");
  });
});

describe("the driver folder actions stack on a phone", () => {
  const source = () => readSource(DRIVER_FOLDER_ADMIN);

  it("declares the shared row and button shapes", () => {
    const file = source();
    expect(file).toContain(
      'const DRIVER_ACTION_ROW = "flex flex-col gap-2 sm:flex-row sm:flex-wrap"',
    );
    expect(file).toContain('const DRIVER_ACTION_BUTTON = "w-full sm:w-auto"');
  });

  it("leaves no single-line wrapping action row behind", () => {
    // The regression this pins: one wrapping row per status, which squeezed three buttons with
    // long labels onto a single line on a phone.
    expect(source()).not.toContain("flex flex-wrap gap-2");
  });

  it("gives every action button the shared shape", () => {
    const actionBar = slice(
      source(),
      "function renderAdminActionBar",
      "async function confirmPendingAction",
    );
    const buttons = actionBar.match(/<Button/g) ?? [];
    const shaped = actionBar.match(/\$\{DRIVER_ACTION_BUTTON\}/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    // One shared shape per button: counting rather than listing, so adding an action cannot
    // quietly skip it.
    expect(shaped).toHaveLength(buttons.length);
  });

  it("keeps the wrapping row and the right alignment for the desktop breakpoint", () => {
    const file = source();
    expect(file).toContain("sm:flex-row sm:flex-wrap");
    // The header row was right-aligned; it must stay so once it is a row again.
    expect(file).toContain("shrink-0 sm:justify-end");
  });
});
