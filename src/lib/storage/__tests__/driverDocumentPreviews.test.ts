/**
 * The driver folder's preview resolution costs what its request count says it costs.
 *
 * The ordering here is the whole fix and it is invisible on screen: the folder used to sign one
 * path at a time, and the resolver it called downloaded each file's bytes through the Next server
 * to build a URL. A folder of five documents waited on five serial downloads before the first
 * thumbnail appeared. A call-count assertion is the only thing that keeps that from coming back —
 * a loop over the signer still reads as a single call in a diff.
 */

jest.mock("@/lib/storage/adminDocumentSignedUrls");

import { fetchAdminDocumentSignedUrls } from "@/lib/storage/adminDocumentSignedUrls";
import { resolveDriverDocumentPreviews } from "@/lib/storage/driverDocumentPreviews";

const signAll = fetchAdminDocumentSignedUrls as unknown as jest.Mock;

beforeEach(() => {
  signAll.mockResolvedValue({});
});

describe("resolveDriverDocumentPreviews", () => {
  it("signs the folder in one request and leaves nothing to the fallback", async () => {
    signAll.mockResolvedValue({
      "d1/a.jpg": "https://signed/a",
      "d1/b.jpg": "https://signed/b",
    });
    const resolveOne = jest.fn(async () => null);

    const urls = await resolveDriverDocumentPreviews(
      [
        { docId: "doc-a", path: "d1/a.jpg" },
        { docId: "doc-b", path: "d1/b.jpg" },
      ],
      "token",
      resolveOne,
    );

    expect(signAll).toHaveBeenCalledTimes(1);
    expect(signAll).toHaveBeenCalledWith(["d1/a.jpg", "d1/b.jpg"], "token");
    expect(resolveOne).not.toHaveBeenCalled();
    expect(urls).toEqual({
      "doc-a": "https://signed/a",
      "doc-b": "https://signed/b",
    });
  });

  it("mentions a path shared by two documents only once", async () => {
    const resolveOne = jest.fn(async () => null);

    await resolveDriverDocumentPreviews(
      [
        { docId: "doc-a", path: "d1/twin.jpg" },
        { docId: "doc-b", path: "d1/twin.jpg" },
      ],
      "token",
      resolveOne,
    );

    expect(signAll).toHaveBeenCalledWith(["d1/twin.jpg"], "token");
  });

  it("falls back only for what the batch missed, and all at once", async () => {
    signAll.mockResolvedValue({ "d1/a.jpg": "https://signed/a" });

    let inFlight = 0;
    let peak = 0;
    const resolveOne = jest.fn(async (path: string) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return `https://fallback/${path}`;
    });

    const urls = await resolveDriverDocumentPreviews(
      [
        { docId: "doc-a", path: "d1/a.jpg" },
        { docId: "doc-b", path: "d1/b.jpg" },
        { docId: "doc-c", path: "d1/c.jpg" },
      ],
      "token",
      resolveOne,
    );

    // Two candidates, in flight together. Max concurrency of 1 is the serial chain that made the
    // folder wait on each download in turn.
    expect(resolveOne).toHaveBeenCalledTimes(2);
    expect(peak).toBe(2);
    expect(urls["doc-a"]).toBe("https://signed/a");
    expect(urls["doc-b"]).toBe("https://fallback/d1/b.jpg");
  });

  it("asks for nothing on an empty folder and never signs without a session", async () => {
    const resolveOne = jest.fn(async () => null);

    expect(await resolveDriverDocumentPreviews([], "token", resolveOne)).toEqual({});
    expect(signAll).not.toHaveBeenCalled();

    await resolveDriverDocumentPreviews(
      [{ docId: "doc-a", path: "d1/a.jpg" }],
      undefined,
      resolveOne,
    );

    // Without a session the route would answer 401; going straight to the per-document chain keeps
    // one guaranteed failure out of the folder's load.
    expect(signAll).not.toHaveBeenCalled();
    expect(resolveOne).toHaveBeenCalledWith("d1/a.jpg", undefined);
  });
});
