import { fetchAdminDocumentSignedUrls } from "./adminDocumentSignedUrls";

/** A document to preview, already resolved to a bucket path. */
export type DriverDocumentPreviewTarget = {
  docId: string;
  path: string;
};

export type SinglePathResolver = (
  path: string,
  accessToken?: string,
) => Promise<string | null>;

/**
 * Resolve a whole folder's preview URLs in two passes.
 *
 * Both passes matter for latency and neither is visible on screen: the folder used to sign one
 * path at a time, and the resolver it called downloaded each file's bytes through the Next server
 * to build a URL. A folder of five documents therefore waited on five serial downloads before the
 * first thumbnail appeared. Here the batch is a single request, and the fallback — only ever
 * reached by whatever the batch could not sign — runs all of its candidates at once.
 *
 * `resolveOne` is injected so the per-document chain (admin proxy, storage signature, upload API)
 * stays where it is and this ordering can be tested on its own.
 */
export async function resolveDriverDocumentPreviews(
  targets: readonly DriverDocumentPreviewTarget[],
  accessToken: string | undefined,
  resolveOne: SinglePathResolver,
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  if (targets.length === 0) return urls;

  if (accessToken) {
    // Two documents can share a path; the batch should still mention it once.
    const uniquePaths: string[] = [];
    for (const target of targets) {
      if (!uniquePaths.includes(target.path)) uniquePaths.push(target.path);
    }
    const batched = await fetchAdminDocumentSignedUrls(uniquePaths, accessToken);
    for (const target of targets) {
      const signed = batched[target.path];
      if (signed) urls[target.docId] = signed;
    }
  }

  const unresolved = targets.filter((target) => !urls[target.docId]);
  await Promise.all(
    unresolved.map(async (target) => {
      const signed = await resolveOne(target.path, accessToken);
      if (signed) urls[target.docId] = signed;
    }),
  );

  return urls;
}
