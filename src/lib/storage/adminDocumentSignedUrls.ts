/**
 * Resolve several private driver-documents paths to signed URLs in one round trip.
 *
 * The folder used to resolve one path at a time, and the chosen resolver downloaded every file's
 * bytes through the Next server just to produce a preview URL. On a folder of five documents that
 * was five serial downloads before the first thumbnail appeared. The route signs server-side with
 * the service role, so a private bucket keeps working, and the browser no longer pays for a byte
 * it does not display.
 */

type BatchSignResponse = {
  ok?: boolean;
  urls?: Record<string, string>;
};

export async function fetchAdminDocumentSignedUrls(
  paths: readonly string[],
  accessToken: string,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  try {
    const res = await fetch("/api/admin/driver-documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ paths }),
    });
    if (!res.ok) {
      console.warn(
        "[adminDocumentSignedUrls] batch signing failed",
        res.status,
        (await res.text()).slice(0, 200),
      );
      return {};
    }
    const body = (await res.json()) as BatchSignResponse;
    return body.urls ?? {};
  } catch (e) {
    console.warn("[adminDocumentSignedUrls] batch signing error", e);
    return {};
  }
}
