import fs from "fs";
import path from "path";

/**
 * Guards how client pushes are *presented*, not whether they are sent.
 *
 * `tag` decides which notifications replace each other, and a replacement is silent: without
 * `renotify` (not reliably supported) the new notification takes the old one's slot in the
 * tray with no sound and no banner. Keying the tag on the ride alone collapsed the three
 * moments of that ride — `ride_accepted`, `driver_arrived` and `ride_completed` all carry the
 * same ride id — so the client got one alert per ride and silence after it, while the server
 * reported every one of them as sent. `testNotification.ts` already documents this behaviour
 * and refuses a tag for that reason; the real handler had to keep one.
 *
 * The worker is executed in a fake `self` rather than pattern-matched: asserting on the
 * *options actually handed to `showNotification`* is what makes this fail when the collapse
 * comes back. A grep for the word `tag` would pass on the broken version.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SERVICE_WORKER = path.join(PROJECT_ROOT, "public/sw-client.js");

const RIDE_ID = "a6cd2a12-c398-465f-b121-50a85a99dec3";
const OTHER_RIDE_ID = "80a2adbf-3673-47a4-8c99-480b6b261108";

type ShownNotification = { title: string; options: Record<string, unknown> };

/** Loads the worker with a fake `self` and returns its handlers plus what it displayed. */
function loadWorker() {
  const source = fs.readFileSync(SERVICE_WORKER, "utf8");
  const handlers = new Map<string, (event: unknown) => void>();
  const shown: ShownNotification[] = [];

  const self = {
    addEventListener: (type: string, handler: (event: unknown) => void) => {
      handlers.set(type, handler);
    },
    registration: {
      showNotification: (title: string, options: Record<string, unknown>) => {
        shown.push({ title, options });
        return Promise.resolve();
      },
    },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    location: { origin: "https://example.test" },
  };

  // `caches` and `fetch` are only reached by the fetch handler, but they are free variables of
  // the evaluated source and must resolve if that handler is ever invoked.
  const caches = { open: () => Promise.resolve({ match: () => Promise.resolve(undefined) }) };
  const fetchStub = () => Promise.reject(new Error("network disabled in test"));

  new Function("self", "caches", "fetch", source)(self, caches, fetchStub);

  return { handlers, shown };
}

/** Dispatches a push with the given payload and waits for the handler's work to settle. */
async function push(payload: unknown): Promise<ShownNotification[]> {
  const { handlers, shown } = loadWorker();
  const handler = handlers.get("push");
  if (!handler) throw new Error("the worker registers no push handler");

  const waits: Promise<unknown>[] = [];
  handler({
    data: {
      json: () => payload,
      text: () => JSON.stringify(payload),
    },
    waitUntil: (work: Promise<unknown>) => waits.push(work),
  });
  await Promise.all(waits);
  return shown;
}

async function tagFor(payload: unknown): Promise<unknown> {
  const shown = await push(payload);
  return shown[0]?.options.tag;
}

const clientPush = (type: string, rideId: string) => ({
  title: "Vector Elegans",
  body: type,
  data: { type, ride_id: rideId },
});

describe("client push presentation", () => {
  it("shows a notification at all", async () => {
    const shown = await push(clientPush("ride_accepted", RIDE_ID));

    expect(shown).toHaveLength(1);
    expect(shown[0].title).toBe("Vector Elegans");
  });

  it("gives the three moments of one ride three distinct tags", async () => {
    // This is the regression. With a ride-only tag all three collide, so only the first
    // alerts and the ride's arrival and completion are silent.
    const accepted = await tagFor(clientPush("ride_accepted", RIDE_ID));
    const arrived = await tagFor(clientPush("driver_arrived", RIDE_ID));
    const completed = await tagFor(clientPush("ride_completed", RIDE_ID));

    expect(accepted).toBeDefined();
    expect(new Set([accepted, arrived, completed]).size).toBe(3);
  });

  it("still collapses a retry of the same moment, so nothing stacks", async () => {
    const first = await tagFor(clientPush("driver_arrived", RIDE_ID));
    const retry = await tagFor(clientPush("driver_arrived", RIDE_ID));

    expect(first).toBe(retry);
  });

  it("keeps two rides apart even for the same moment", async () => {
    const one = await tagFor(clientPush("ride_accepted", RIDE_ID));
    const other = await tagFor(clientPush("ride_accepted", OTHER_RIDE_ID));

    expect(one).not.toBe(other);
  });

  it("falls back to a single tag when the payload carries no ride", async () => {
    // A notification with no ride (an account notice, say) must still be replaceable rather
    // than uncollapsible.
    const tag = await tagFor({ title: "Vector Elegans", body: "Compte", data: {} });

    expect(tag).toBe("notification");
  });
});
