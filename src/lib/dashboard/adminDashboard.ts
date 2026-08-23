export function truncateAddress(
  address: string | null | undefined,
  max = 36,
): string {
  const value = (address ?? "").trim();
  if (!value) return "—";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}
