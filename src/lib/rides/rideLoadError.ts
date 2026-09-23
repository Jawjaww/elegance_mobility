// Why this exists
// --------------
// The admin rides list has exactly one failure mode that used to be silent: the chunk
// fetch throws, React Query flips to `isError`, and the operator only ever saw
// "Impossible de charger les courses." That sentence names neither the cause nor a way
// out, so a failed load was indistinguishable from a filter that matches nothing, and
// every report of it cost a full debugging session.
//
// The thrown value is a `PostgrestError` (it extends `Error` and carries `code`, see
// @supabase/postgrest-js/src/PostgrestError.ts). The code is the single most diagnostic
// token we can show: `42501` is a permission denial, `PGRST301` an expired JWT. A bare
// network failure instead arrives as a `TypeError: Failed to fetch`. Both must render.
//
// This stays a pure function so the extraction can be asserted directly, including the
// shapes that are not `Error` instances — a defensive branch is worthless if nothing
// ever proves it runs.

export const UNKNOWN_RIDE_LOAD_ERROR =
  "Cause inconnue : le client n'a renvoyé aucun message.";

/**
 * Turns any thrown value into a single readable line for the operator.
 *
 * Never throws and never returns an empty string, so the caller can render the result
 * unconditionally.
 */
export function describeRideLoadError(error: unknown): string {
  if (error === null || error === undefined) return UNKNOWN_RIDE_LOAD_ERROR;

  if (typeof error === "string") {
    return error.trim() || UNKNOWN_RIDE_LOAD_ERROR;
  }

  if (typeof error === "object") {
    const candidate = error as { message?: unknown; code?: unknown };
    const message =
      typeof candidate.message === "string" ? candidate.message.trim() : "";
    const code = typeof candidate.code === "string" ? candidate.code.trim() : "";

    // PostgREST puts the HTTP-level reason in `message` and the SQLSTATE in `code`;
    // the code alone is often what identifies the real problem.
    if (message && code) return `${message} (${code})`;
    if (message) return message;
    if (code) return `Code ${code}`;
  }

  try {
    return JSON.stringify(error) ?? UNKNOWN_RIDE_LOAD_ERROR;
  } catch {
    return UNKNOWN_RIDE_LOAD_ERROR;
  }
}
