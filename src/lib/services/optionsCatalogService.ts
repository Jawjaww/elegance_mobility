import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";

export type CatalogOption = Database["public"]["Tables"]["options"]["Row"];

/** Legacy reservation keys → current option names in DB */
const LEGACY_OPTION_ALIASES: Record<string, string> = {
  childSeat: "Siège enfant",
  child_seat: "Siège enfant",
  "Siège bébé": "Siège enfant",
  petFriendly: "Animaux domestiques",
  pet_friendly: "Animaux domestiques",
  pets: "Animaux domestiques",
  boissons: "Boissons premium",
  accueil: "Accueil personnalisé",
};

export function normalizeOptionName(key: string): string {
  return LEGACY_OPTION_ALIASES[key] ?? key;
}

export function normalizeSelectedOptions(selected: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  for (const raw of selected ?? []) {
    const name = normalizeOptionName(raw);
    if (name) seen.add(name);
  }
  return [...seen];
}

export async function listAvailableOptions(): Promise<CatalogOption[]> {
  const { data, error } = await supabase
    .from("options")
    .select("*")
    .eq("available", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/** Full catalog (incl. unavailable) for resolving prices on existing rides */
export async function listOptionsCatalog(): Promise<
  Pick<CatalogOption, "name" | "price" | "available">[]
> {
  const { data, error } = await supabase
    .from("options")
    .select("name, price, available")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export function formatOptionPrice(price: number): string {
  if (price <= 0) return "Inclus";
  return `Ajout ${new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price)}`;
}
