"use client";

import { useEffect, useState } from "react";
import { Car, CheckCircle2 } from "lucide-react";
import {
  formatOptionPrice,
  listOptionsCatalog,
  normalizeSelectedOptions,
  type CatalogOption,
} from "@/lib/services/optionsCatalogService";

const VEHICLE_LABELS: Record<string, string> = {
  STANDARD: "Berline Standard",
  PREMIUM: "Berline Premium",
  VAN: "Van",
  ELECTRIC: "Électrique",
};

type Props = {
  options?: string[] | null;
  vehicleType?: string | null;
  className?: string;
  /** map = white pills on map; sheet = dark sheet (RideRequest) */
  variant?: "map" | "sheet";
};

export function RideOfferExtras({
  options,
  vehicleType,
  className = "",
  variant = "map",
}: Readonly<Props>) {
  const [catalog, setCatalog] = useState<
    Pick<CatalogOption, "name" | "price" | "available">[]
  >([]);

  useEffect(() => {
    let mounted = true;
    listOptionsCatalog()
      .then((rows) => {
        if (mounted) setCatalog(rows);
      })
      .catch(() => {
        if (mounted) setCatalog([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const names = normalizeSelectedOptions(options);
  const vehicle = vehicleType
    ? (VEHICLE_LABELS[vehicleType] ?? vehicleType)
    : "";

  if (!vehicle && names.length === 0) return null;

  const priceFor = (name: string) => {
    const hit = catalog.find((o) => o.name === name);
    if (!hit) return null;
    const n = Number(hit.price);
    if (n <= 0) return "Inclus";
    return formatOptionPrice(n).replace("Ajout ", "+");
  };

  const pillClass =
    variant === "sheet"
      ? "flex items-center gap-2 bg-neutral-800/50 px-2 py-1.5 rounded-lg border border-white/5"
      : "flex items-center gap-2 bg-white/95 px-2 py-1 rounded border border-white/40 shadow-sm";
  const textClass =
    variant === "sheet"
      ? "text-xs text-neutral-200 truncate whitespace-nowrap"
      : "text-xs text-gray-700 truncate whitespace-nowrap";
  const iconClass =
    variant === "sheet" ? "h-4 w-4 text-emerald-400 shrink-0" : "h-4 w-4 text-gray-400 shrink-0";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {vehicle ? (
        <div className={pillClass}>
          <Car className={iconClass} />
          <span className={textClass}>{vehicle}</span>
        </div>
      ) : null}
      {names.map((name) => {
        const price = priceFor(name);
        const label = price ? `${name} · ${price}` : name;
        return (
          <div key={name} className={pillClass}>
            <CheckCircle2 className={iconClass} />
            <span className={textClass}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
