"use client";

import { useEffect, useState } from "react";
import { optionIcon, shortOptionLabel } from "@/lib/reservation/optionGlyphs";

/** Same hide as the driver offer payment badge: tap, read, it gets out of the way. */
const AUTO_HIDE_MS = 5000;

/**
 * Selected extras as a row of map icons (bottom-right). Tap reveals the short label, then it
 * closes on its own — the confirmation card must not grow a chip row for a fact already chosen.
 */
export function TripOptionOverlay({
  options,
}: Readonly<{
  options: string[];
}>) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    if (!openKey) return undefined;
    const timer = setTimeout(() => setOpenKey(null), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [openKey]);

  if (options.length === 0) return null;

  return (
    <ul className="pointer-events-none absolute bottom-3 right-3 z-10 flex max-w-[55%] flex-wrap justify-end gap-1.5">
      {options.map((option) => {
        const Icon = optionIcon(option);
        const label = shortOptionLabel(option);
        const open = openKey === option;

        return (
          <li key={option} className="flex items-center">
            <button
              type="button"
              aria-expanded={open}
              aria-label={label}
              onClick={() =>
                setOpenKey((current) => (current === option ? null : option))
              }
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 py-1.5 pl-1.5 pr-2 shadow-lg shadow-black/10 backdrop-blur-xl backdrop-saturate-150"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/15">
                <Icon className="h-3.5 w-3.5 text-blue-700" aria-hidden />
              </span>
              {open ? (
                <span className="max-w-[7.5rem] truncate text-xs font-medium text-neutral-900">
                  {label}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
