/**
 * Petits formateurs partagés par les écrans du portail opérateur.
 *
 * Ils vivent ici plutôt que dans une page : deux écrans affichent un nom de chauffeur, et
 * importer depuis `../drivers/page` ferait dépendre une route d'une autre route.
 */

export function driverDisplayName(driver: {
  first_name: string | null;
  last_name: string | null;
}): string {
  const name = [driver.first_name, driver.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ");

  return name || "—";
}

export function formatRideDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function formatAmount(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)} €`;
}
