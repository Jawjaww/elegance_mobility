"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PolicyHelp } from "./policyCopy";

export function PolicyInfoButton({
  help,
}: Readonly<{ help: PolicyHelp }>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-600 text-neutral-400 hover:border-blue-400/50 hover:text-blue-300"
          aria-label={`Qu’est-ce que : ${help.term} ?`}
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 border-neutral-700 bg-neutral-950 p-3 text-neutral-100"
      >
        <p className="text-sm font-semibold text-white">{help.term}</p>
        <p className="mt-0.5 text-xs text-blue-300/90">{help.gloss}</p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-300">
          {help.what}
        </p>
        {help.ifRaise.startsWith("Sans objet") ? null : (
          <p className="mt-2 text-[11px] leading-relaxed text-emerald-300/80">
            Si vous augmentez : {help.ifRaise}
          </p>
        )}
        {help.ifLower.startsWith("Sans objet") ? null : (
          <p className="mt-1 text-[11px] leading-relaxed text-amber-300/80">
            Si vous baissez : {help.ifLower}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
