export const DRIVER_DOCS_BUCKET = "driver-documents";

/**
 * Normalize a driver-documents object key: strip leading slashes, query string,
 * and a redundant `driver-documents/` bucket prefix from legacy rows.
 */
export function normalizeDriverDocumentPath(raw: string): string | null {
  let path = raw.trim().split("?")[0] ?? "";
  while (path.startsWith("/")) path = path.slice(1);
  if (!path || path.includes("..")) return null;

  const prefix = `${DRIVER_DOCS_BUCKET}/`;
  if (path.toLowerCase().startsWith(prefix)) {
    path = path.slice(prefix.length);
    while (path.startsWith("/")) path = path.slice(1);
  }

  if (!path || path.includes("..")) return null;
  return path;
}

/** Paths to try when downloading: normalized first, then the raw object key. */
export function driverDocumentStorageCandidates(raw: string): string[] {
  let withoutSlash = raw.trim().split("?")[0] ?? "";
  while (withoutSlash.startsWith("/")) withoutSlash = withoutSlash.slice(1);

  const normalized = normalizeDriverDocumentPath(raw);
  const out: string[] = [];
  if (normalized) out.push(normalized);
  if (
    withoutSlash &&
    withoutSlash !== normalized &&
    !withoutSlash.includes("..")
  ) {
    out.push(withoutSlash);
  }
  return out;
}

/** Resolve a storage object path from a DB file_url (path or legacy URL). */
export function toStoragePath(fileUrl: string): string | null {
  const trimmed = fileUrl.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return normalizeDriverDocumentPath(trimmed);
  }
  try {
    const url = new URL(trimmed);
    const markers = [
      `/object/public/${DRIVER_DOCS_BUCKET}/`,
      `/object/sign/${DRIVER_DOCS_BUCKET}/`,
      `/object/authenticated/${DRIVER_DOCS_BUCKET}/`,
    ];
    for (const marker of markers) {
      const idx = url.pathname.indexOf(marker);
      if (idx !== -1) {
        const raw = decodeURIComponent(url.pathname.slice(idx + marker.length));
        return normalizeDriverDocumentPath(raw);
      }
    }
  } catch {
    return null;
  }
  return null;
}
