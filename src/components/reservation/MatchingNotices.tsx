"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildRebookHref } from "@/lib/rides/rideCancelLabels";

type RebookRide = {
  pickup_address: string;
  dropoff_address: string;
  pickup_lat?: number | null;
  pickup_lon?: number | null;
  dropoff_lat?: number | null;
  dropoff_lon?: number | null;
  vehicle_type?: string | null;
  options?: string[] | null;
};

export function SystemExpiredNotice({
  ride,
  onNavigate,
  compact = false,
}: Readonly<{
  ride: RebookRide;
  onNavigate?: () => void;
  compact?: boolean;
}>) {
  const rebookHint = compact
    ? ""
    : " Vous pouvez recréer la même course en un clic.";
  return (
    <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3 space-y-2">
      <p className="text-sm text-sky-100">
        Désolé — aucun chauffeur n&apos;a pu être trouvé à temps. Aucun frais
        ne s&apos;applique.
        {rebookHint}
      </p>
      <Button asChild size="sm" className="bg-sky-500/90 text-neutral-950">
        <Link href={buildRebookHref(ride)} onClick={onNavigate}>
          Recréer cette course
        </Link>
      </Button>
    </div>
  );
}

export function CancelPolicyLine({
  text,
}: Readonly<{ text: string | null }>) {
  if (!text) return null;
  return <p className="text-xs text-neutral-400">{text}</p>;
}
