import fs from "fs";
import path from "path";

/**
 * The backoffice identifies a driver by name, and two real accounts named "Jaw Ben" and
 * "jaw ben" were indistinguishable there — the wrong dossier was opened during an ops check, and
 * a driver who had never been touched appeared suspended.
 *
 * The fix is one field: the account email. It is read from `auth.users` through the admin-only
 * RPC `admin_driver_account_emails`, because that schema is not reachable from the browser
 * client no matter how privileged the signed-in account is.
 *
 * These assertions pin the two places it has to stay visible, and the path it has to take. A
 * silent removal of either display would put the backoffice back exactly where it was. Source
 * level, like `mobileDialogAndActions.test.ts`: this repository has no component-rendering setup,
 * and the JSX under test is what is being pinned.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const ADMIN_DRIVERS = path.join(PROJECT_ROOT, "src/lib/drivers/adminDrivers.ts");
const DRIVER_LIST_CARD = path.join(
  PROJECT_ROOT,
  "src/components/admin/drivers/DriverListCard.tsx",
);
const DRIVER_FOLDER_ADMIN = path.join(
  PROJECT_ROOT,
  "src/components/admin/drivers/DriverFolderAdmin.tsx",
);

/** Comments removed in a single pass, block form first, so that a block opener typed inside a
 * line comment cannot open a phantom block and swallow the code that follows. Whitespace is
 * then collapsed. Comments must go because these files explain the feature by naming the very
 * identifiers being asserted. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, " ");
}

function readSource(file: string): string {
  return stripComments(fs.readFileSync(file, "utf8")).replace(/\s+/g, " ");
}

/** The slice between two markers, the closing one searched after the opening one. */
function slice(source: string, from: string, to: string): string {
  const start = source.indexOf(from);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf(to, start + from.length);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("the driver list shows the account email", () => {
  it("renders it from the row rather than leaving the card on name and phone", () => {
    const card = readSource(DRIVER_LIST_CARD);
    expect(card).toContain("driver.account_email");
    expect(card).toContain("Mail");
    // Shown only when resolved: an empty row would read as "no email on file" rather than
    // "could not read it".
    expect(card).toMatch(/\{driver\.account_email \? \(/);
  });

  it("leads with it, before the phone", () => {
    // The email is the disambiguator, so it must not be demoted below the fields that do not
    // distinguish two homonyms.
    const card = readSource(DRIVER_LIST_CARD);
    const emailAt = card.indexOf('label="Email"');
    const phoneAt = card.indexOf('label="Téléphone"');
    expect(emailAt).toBeGreaterThan(-1);
    expect(phoneAt).toBeGreaterThan(-1);
    expect(emailAt).toBeLessThan(phoneAt);
  });
});

describe("the driver folder header shows the account email", () => {
  const header = () =>
    slice(
      readSource(DRIVER_FOLDER_ADMIN),
      'className="min-w-0"',
      'ID: {driver?.id}',
    );

  it("renders it in the header, not in the details below", () => {
    const source = header();
    expect(source).toContain("accountEmail");
    expect(source).toContain("Mail");
    // Between the "Dossier chauffeur" subtitle and the dossier id: that is the header block.
    expect(source).toContain("Dossier chauffeur");
  });

  it("resolves it through the admin-only RPC helper", () => {
    const folder = readSource(DRIVER_FOLDER_ADMIN);
    expect(folder).toContain("fetchDriverAccountEmails([driverId])");
    // Never a column read: `drivers` has no email, and inventing one would break this page.
    expect(folder).not.toContain('select("email")');
  });
});

describe("the email is read from auth.users, behind a guard", () => {
  const source = () => readSource(ADMIN_DRIVERS);

  it("goes through the batch RPC", () => {
    expect(source()).toContain('supabase.rpc("admin_driver_account_emails"');
    expect(source()).toContain("p_driver_ids: uniqueIds");
  });

  it("never queries auth.users from the browser client", () => {
    // The whole reason the RPC exists: `auth.users` is not readable by an authenticated admin.
    expect(source()).not.toContain("auth.users");
  });

  it("degrades to no email instead of failing the whole list", () => {
    const file = source();
    // A cloud deploy can lag the app, so an unavailable RPC must not empty the list.
    expect(file).toMatch(/if \(error\) \{ console\.warn\(/);
    expect(file).toContain("account_email: emailsByDriverId.get(driver.id) ?? null");
  });
});
