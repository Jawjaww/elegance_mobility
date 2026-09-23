/**
 * The driver folder load path costs what its request count says it costs.
 *
 * Nothing on screen changes when the folder stops overlapping its reads: the same fields fill in,
 * only later. The old preview resolver was worse — it downloaded every document's bytes through
 * the Next server just to build a thumbnail URL, and did it one document at a time, so a folder of
 * five documents paid five serial downloads. Neither is visible in a screenshot.
 *
 * Two of the shapes below are ordering decisions inside a React component rather than behaviour an
 * export can expose, so they are asserted on the source, the way `fcmServiceResolution.test.ts`
 * asserts the Android manifest: a reviewer cannot see an `await` move out of a `Promise.all` in a
 * diff, and that is exactly the regression worth catching.
 */

jest.mock("@/lib/database/admin-auth", () => ({
  requireAdmin: jest.fn(async () => ({ error: null })),
}));

jest.mock("@/lib/database/admin-client", () => ({
  getAdminSupabase: jest.fn(),
}));

import { readFileSync } from "fs";
import { getAdminSupabase } from "@/lib/database/admin-client";
import { POST } from "@/app/api/admin/driver-documents/route";
import { fetchAdminDocumentSignedUrls } from "@/lib/storage/adminDocumentSignedUrls";

const COMPONENT = "src/components/admin/drivers/DriverFolderAdmin.tsx";

function readSource(relativePath: string): string {
  return (readFileSync as (p: string, e: string) => string)(
    `${process.cwd()}/${relativePath}`,
    "utf8",
  );
}

function sliceBetween(source: string, from: string, to: string): string {
  const start = source.indexOf(from);
  if (start === -1) throw new Error(`marker not found: ${from}`);
  const end = source.indexOf(to, start + from.length);
  if (end === -1) throw new Error(`end marker not found: ${to}`);
  return source.slice(start, end);
}

/** Parenthesised argument list of the first call matching `signature`, brackets balanced. */
function extractCallArgs(source: string, signature: string): string {
  const at = source.indexOf(signature);
  if (at === -1) throw new Error(`call not found: ${signature}`);
  const open = source.indexOf("(", at);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`unbalanced call: ${signature}`);
}

describe("the driver folder load ordering", () => {
  const loadData = sliceBetween(
    readSource(COMPONENT),
    'console.log("[DriverFolderAdmin] Loading data for driverId:"',
    "async function saveDriver(",
  );

  it("issues the email, documents and vehicles reads together", () => {
    const reads = extractCallArgs(loadData, "await Promise.all(");

    // Three reads that only need the driver id. Awaiting them in turn spent two extra round trips
    // before anything could render.
    expect(reads).toContain("fetchDriverAccountEmails(");
    expect(reads).toContain('from("driver_documents")');
    expect(reads).toContain('from("vehicles")');
  });

  it("keeps the serial work to the driver row alone", () => {
    // The regression: a read that used to be batched going back to its own `await`. The batch
    // assertion above would not notice, because the call site would still exist.
    const serialReads = loadData.match(/await supabase/g) ?? [];
    expect(serialReads).toHaveLength(1);
    expect(loadData).not.toMatch(/await\s+fetchDriverAccountEmails\(/);
    expect(loadData).not.toMatch(/await\s+generateSignedUrls\(/);
    expect(loadData).not.toMatch(/await\s+fetchCompleteness\(/);
  });

  it("overlaps the previews with the completeness check", () => {
    // Both need the documents and the plate resolved above, and neither needs the other.
    const batches = loadData.match(/await Promise\.all\(/g) ?? [];
    expect(batches).toHaveLength(2);
    expect(loadData).toContain("generateSignedUrls(");
    expect(loadData).toContain("fetchCompleteness(");
  });
});

describe("the batched signed-URL client", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  function stubFetch(impl: jest.Mock) {
    global.fetch = impl as unknown as typeof fetch;
    return impl;
  }

  it("signs every path in one request", async () => {
    const fetchMock = stubFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          urls: { "d1/a.jpg": "https://signed/a", "d1/b.jpg": "https://signed/b" },
        }),
        text: async () => "",
      }),
    );

    const urls = await fetchAdminDocumentSignedUrls(
      ["d1/a.jpg", "d1/b.jpg"],
      "token-123",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/driver-documents");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ paths: ["d1/a.jpg", "d1/b.jpg"] });
    expect(init.headers.Authorization).toBe("Bearer token-123");
    expect(urls).toEqual({
      "d1/a.jpg": "https://signed/a",
      "d1/b.jpg": "https://signed/b",
    });
  });

  it("asks for nothing when the folder has no documents", async () => {
    const fetchMock = stubFetch(jest.fn());

    expect(await fetchAdminDocumentSignedUrls([], "token")).toEqual({});

    // An empty folder must not buy a round trip whose answer is known in advance.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("degrades to an empty map instead of throwing", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});

    stubFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "forbidden",
      }),
    );
    await expect(fetchAdminDocumentSignedUrls(["d1/a.jpg"], "t")).resolves.toEqual(
      {},
    );

    stubFetch(jest.fn().mockRejectedValue(new Error("offline")));
    await expect(fetchAdminDocumentSignedUrls(["d1/a.jpg"], "t")).resolves.toEqual(
      {},
    );
  });
});

describe("the admin document route", () => {
  const createSignedUrl = jest.fn();
  const from = jest.fn(() => ({ createSignedUrl }));

  /** jsdom ships neither `Request` nor `Response`; the route needs only these two shapes. */
  class StubResponse {
    readonly status: number;

    constructor(
      private readonly payload: string,
      init: { status?: number } = {},
    ) {
      this.status = init.status ?? 200;
    }

    async json(): Promise<unknown> {
      return JSON.parse(this.payload);
    }
  }

  beforeAll(() => {
    globalThis.Response = StubResponse as unknown as typeof Response;
  });

  beforeEach(() => {
    createSignedUrl.mockImplementation(async (path: string) => ({
      data: { signedUrl: `https://signed/${path}` },
      error: null,
    }));
    (getAdminSupabase as unknown as jest.Mock).mockReturnValue({
      storage: { from },
    });
  });

  function post(body: unknown) {
    // jsdom exposes no `Request`, and the handler only reads the JSON body — `requireAdmin` is
    // mocked above, so nothing else touches the request.
    return POST({ json: async () => body } as unknown as Request);
  }

  it("returns one signed URL per requested path", async () => {
    const res = await post({ paths: ["d1/a.jpg", "d1/b.jpg"] });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      urls: {
        "d1/a.jpg": "https://signed/d1/a.jpg",
        "d1/b.jpg": "https://signed/d1/b.jpg",
      },
    });
  });

  it("keys the answer on the path the client asked for, not the legacy one it resolved", async () => {
    createSignedUrl.mockImplementation(async (path: string) =>
      path === "d1/legacy.jpg"
        ? { data: { signedUrl: "https://signed/normalised" }, error: null }
        : { data: null, error: { message: "Object not found" } },
    );

    const res = await post({ paths: ["driver-documents/d1/legacy.jpg"] });

    // The bucket holds the normalised key, but the client looks its document up by the path it
    // sent, so a mismatch here would silently drop the preview.
    expect(await res.json()).toEqual({
      ok: true,
      urls: { "driver-documents/d1/legacy.jpg": "https://signed/normalised" },
    });
  });

  it("refuses an empty path list instead of signing nothing", async () => {
    const res = await post({ paths: [] });

    expect(res.status).toBe(400);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
