"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import type { RideWithRelations } from "@/lib/stores/unifiedRidesStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/reservation/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  canceledByLabel,
  cleanPickupNotes,
  formatPersonName,
} from "@/lib/rides/rideCancelLabels";

type HistoryRow = Database["public"]["Tables"]["ride_status_history"]["Row"];

function formatDt(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMM yyyy à HH:mm", { locale: fr });
  } catch {
    return value;
  }
}

function formatEuro(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm py-1.5 border-b border-neutral-800/80 last:border-0">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-100 break-words">{value}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="space-y-1">
      <h4 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-2">
        {title}
      </h4>
      <dl className="rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-1">
        {children}
      </dl>
    </section>
  );
}

export function RideDetailDialog({
  ride,
  open,
  onOpenChange,
}: Readonly<{
  ride: RideWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!open || !ride?.id) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data } = await supabase
          .from("ride_status_history")
          .select("*")
          .eq("ride_id", ride.id)
          .order("changed_at", { ascending: false })
          .limit(20);
        if (!cancelled) setHistory(data ?? []);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, ride?.id]);

  if (!ride) return null;

  const customerName = formatPersonName(
    ride.customer?.first_name,
    ride.customer?.last_name,
  );
  const driverName = ride.driver
    ? formatPersonName(ride.driver.first_name, ride.driver.last_name)
    : null;
  const notes = cleanPickupNotes(ride.pickup_notes);
  const isCanceled = ride.status.includes("canceled");
  const price =
    ride.final_price ?? ride.price ?? ride.estimated_price ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 text-neutral-100">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
            <span className="font-mono text-sm text-neutral-400">
              {ride.id}
            </span>
            <StatusBadge status={ride.status} showDetailed />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <Section title="Identité">
            <DetailRow label="Créée le" value={formatDt(ride.created_at)} />
            <DetailRow label="Pickup" value={formatDt(ride.pickup_time)} />
            <DetailRow label="Acceptée le" value={formatDt(ride.accepted_at)} />
            <DetailRow label="Mise à jour" value={formatDt(ride.updated_at)} />
          </Section>

          <Section title="Trajet">
            <DetailRow label="Départ" value={ride.pickup_address} />
            <DetailRow label="Arrivée" value={ride.dropoff_address} />
            <DetailRow label="Véhicule" value={ride.vehicle_type || "—"} />
            <DetailRow
              label="Options"
              value={
                ride.options?.length
                  ? ride.options.join(", ")
                  : "Aucune"
              }
            />
            <DetailRow
              label="Distance"
              value={
                ride.distance != null ? `${ride.distance.toFixed(1)} km` : "—"
              }
            />
            <DetailRow
              label="Durée"
              value={
                ride.duration != null ? `${Math.round(ride.duration)} min` : "—"
              }
            />
            <DetailRow label="Prix" value={formatEuro(price)} />
          </Section>

          <Section title="Donneur d'ordre / compte client">
            <DetailRow label="Nom" value={customerName} />
            <DetailRow
              label="Téléphone"
              value={ride.customer?.phone || "—"}
            />
            <DetailRow
              label="User id"
              value={
                ride.user_id ? (
                  <span className="font-mono text-xs">{ride.user_id}</span>
                ) : (
                  "—"
                )
              }
            />
          </Section>

          <Section title="Chauffeur">
            <DetailRow
              label="Assigné"
              value={driverName ?? "Non assigné"}
            />
            {ride.driver_id ? (
              <DetailRow
                label="Driver id"
                value={
                  <span className="font-mono text-xs">{ride.driver_id}</span>
                }
              />
            ) : null}
          </Section>

          <Section title="Notes / observations">
            <DetailRow
              label="Pickup notes"
              value={notes ?? "Aucune note"}
            />
          </Section>

          {isCanceled ? (
            <Section title="Annulation">
              <DetailRow
                label="Par"
                value={canceledByLabel(ride.canceled_by)}
              />
              <DetailRow label="Le" value={formatDt(ride.canceled_at)} />
              <DetailRow
                label="Motif"
                value={ride.cancellation_reason || "Motif non renseigné"}
              />
            </Section>
          ) : null}

          <Section title="Historique des statuts">
            <HistoryList loading={historyLoading} rows={history} />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryList({
  loading,
  rows,
}: Readonly<{ loading: boolean; rows: HistoryRow[] }>) {
  if (loading) {
    return <p className="text-sm text-neutral-500 py-2">Chargement…</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-2">
        Aucun événement enregistré.
      </p>
    );
  }
  return (
    <ul className="space-y-2 py-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-wrap items-center gap-2 text-xs text-neutral-300"
        >
          <Badge
            variant="outline"
            className="border-neutral-700 text-neutral-300 font-normal"
          >
            {row.previous_status || "—"} → {row.status}
          </Badge>
          <span className="text-neutral-500">{formatDt(row.changed_at)}</span>
          {row.notes ? (
            <span className="text-neutral-400">{row.notes}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
