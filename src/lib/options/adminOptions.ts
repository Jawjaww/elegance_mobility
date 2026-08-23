import type { OptionRow } from "@/lib/services/optionsAdminService";

export function filterOptions(
  options: OptionRow[],
  search: string,
): OptionRow[] {
  const query = search.trim().toLowerCase();
  if (!query) return options;

  return options.filter((option) => {
    const name = (option.name ?? "").toLowerCase();
    const description = (option.description ?? "").toLowerCase();
    return name.includes(query) || description.includes(query);
  });
}

export function formatOptionPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}
