export function truncateAddress(
  address: string | null | undefined,
  max = 36,
): string {
  const value = (address ?? "").trim();
  if (!value) return "—";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

/** PostgREST `or` for delayed + pending already past pickup (cron gap). */
export function overdueUnassignedOrFilter(nowIso: string): string {
  const safe = nowIso.replaceAll('"', "");
  return `status.eq.delayed,and(status.eq.pending,pickup_time.lt."${safe}")`;
}
