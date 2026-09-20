import fs from "fs";
import path from "path";

/**
 * Guards the app worker against losing its `fetch` handler.
 *
 * This is the regression that broke installation on Android. The worker handled `push`
 * only, which is enough for notifications — so the notification channel kept working and
 * hid the problem. Android, Brave and Chrome alike, refuses to build a real app (a WebAPK)
 * without a worker in scope handling `fetch`; it then answers "impossible d'installer cette
 * application". Nothing in `Page.getInstallabilityErrors` reports that gate — the manifest,
 * icons, `start_url` and `scope` all pass, and the API returns an empty list for this very
 * site — which is why the loss was invisible until a user tried to install.
 *
 * Source-level assertions: the file is a plain static asset, never imported by the app, so
 * there is nothing to render against.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SERVICE_WORKER = path.join(PROJECT_ROOT, "public/sw-client.js");

/** Whitespace collapsed, so the assertions do not break on reformatting. */
function readWorker(): string {
  return fs.readFileSync(SERVICE_WORKER, "utf8").replace(/\s+/g, " ");
}

/**
 * Comments are removed before any assertion about *code*. Two guards already tripped over
 * their own prose: a comment citing the `/icons/` prefix pattern was read as an icon
 * reference, and one explaining why `waitUntil` is forbidden contained the word itself.
 * A guard must read the code, never the explanation of the code.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

/**
 * The `fetch` listener's body only, comments removed — from its registration to the next
 * `self.addEventListener`. Needed because `install` and `activate` legitimately call
 * `waitUntil`, so a whole-file search would not tell the fetch handler's own use apart.
 */
function fetchHandlerCode(): string {
  // Comments are stripped while the line breaks still exist: collapsing whitespace first
  // would leave a single `//` with no newline to stop at, swallowing the rest of the file.
  const source = stripComments(fs.readFileSync(SERVICE_WORKER, "utf8")).replace(/\s+/g, " ");
  const afterFetch = source.split(/addEventListener\(\s*"fetch"/)[1] ?? "";
  return afterFetch.split(/self\.addEventListener/)[0] ?? "";
}

describe("installable app shell", () => {
  it("handles fetch, which is what Android requires to install the app", () => {
    expect(readWorker()).toMatch(/addEventListener\(\s*"fetch"/);
  });

  it("still handles push", () => {
    // Non-vacuity: adding the install path must not have cost the notification channel.
    expect(readWorker()).toMatch(/addEventListener\(\s*"push"/);
  });

  it("leaves navigations, cross-origin and non-GET traffic to the network", () => {
    const handler = fetchHandlerCode();

    // Caching the HTML shell is how a deploy turns into a stale app, and answering API
    // calls from cache could replay a ride status. Only same-origin GETs under the two
    // static prefixes may be answered, so the handler must bail out otherwise.
    expect(handler).toMatch(/request\.method !== "GET"/);
    expect(handler).toMatch(/url\.origin !== self\.location\.origin/);
    expect(handler).toMatch(/if \(!immutable && !revalidate\) return;/);
  });

  it("keeps the fetch handler synchronous-complete, with no waitUntil after an await", () => {
    // `waitUntil` raises `InvalidStateError` once the handler has returned, so a background
    // refresh written after an `await` fails at runtime — silently, since nothing surfaces
    // the error. Everything must therefore complete inside `respondWith`. This was a real
    // defect in the first version: the icon branch called `waitUntil` after two awaits.
    const handler = fetchHandlerCode();

    expect(handler).not.toContain("waitUntil");
    // Offline fallback: network-first paths still serve the cached copy when the network
    // is unavailable, which is what makes the shell usable offline at all.
    expect(handler).toMatch(/if \(cached\) return cached;/);
  });

  it("revalidates the icon set instead of treating it as immutable", () => {
    // Icon filenames stay stable across artwork changes — these were redesigned — so
    // cache-first would have pinned the previous drawings on every device that had them.
    const worker = readWorker();
    const immutable = worker.match(/IMMUTABLE_PREFIXES = \[([^\]]*)\]/)?.[1] ?? "";
    const revalidated = worker.match(/REVALIDATE_PREFIXES = \[([^\]]*)\]/)?.[1] ?? "";

    expect(immutable).toContain("/_next/static/");
    expect(immutable).not.toContain("/icons/");
    expect(revalidated).toContain("/icons/");
  });
});
