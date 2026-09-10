"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/lib/database/client";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import {
  adminMatchingBadgeOverride,
  canceledByLabel,
  cancelBillingLabel,
  cleanPickupNotes,
  delayKindLabel,
  formatPersonName,
} from "@/lib/rides/rideCancelLabels";
import {
  formatFeeEuro,
  parseFeePolicySnapshot,
} from "@/lib/rides/rideFeePolicy";
import {
  patchRideFeeSnapshot,
  reapplyPlatformSnapshotToRide,
} from "@/lib/services/rideFeePolicyAdminService";

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

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function kmLabel(distance: number | null | undefined): string {
  if (distance == null) return "—";
  return `${distance.toFixed(1)} km`;
}

function minutesLabel(duration: number | null | undefined): string {
  if (duration == null) return "—";
  return `${Math.round(duration)} min`;
}

function optionsLabel(options: string[] | null | undefined): string {
  if (options?.length) return options.join(", ");
  return "Aucune";
}

function pauseLabel(
  matchingPaused: boolean,
  pausedAt: string | null | undefined,
): string {
  if (!matchingPaused) return "Non";
  return formatDt(pausedAt);
}

function loadingMessage(missing: boolean, historyLoading: boolean): string {
  if (missing && !historyLoading) return "Course introuvable.";
  return "Chargement…";
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

async function fetchRideDetail(rideId: string): Promise<{
  ride: RideWithRelations | null;
  history: HistoryRow[];
  missing: boolean;
}> {
  const { data: rideRow } = await supabase
    .from("rides")
    .select(
      `
      *,
      driver:drivers(id, first_name, last_name, phone),
      customer:users!rides_user_id_fkey(id, first_name, last_name, phone)
    `,
    )
    .eq("id", rideId)
    .maybeSingle();

  if (!rideRow) {
    return { ride: null, history: [], missing: true };
  }

  const row = rideRow as RideWithRelations & {
    driver?: RideWithRelations["driver"] | RideWithRelations["driver"][];
    customer?: RideWithRelations["customer"] | RideWithRelations["customer"][];
  };

  const { data } = await supabase
    .from("ride_status_history")
    .select("*")
    .eq("ride_id", rideId)
    .order("changed_at", { ascending: false })
    .limit(20);

  return {
    ride: {
      ...row,
      driver: firstRelation(row.driver),
      customer: firstRelation(row.customer),
    },
    history: data ?? [],
    missing: false,
  };
}

function RideDetailContent({
  ride,
  history,
  historyLoading,
  onSnapshotUpdated,
}: Readonly<{
  ride: RideWithRelations;
  history: HistoryRow[];
  historyLoading: boolean;
  onSnapshotUpdated: () => void;
}>) {
  const customerName = formatPersonName(
    ride.customer?.first_name,
    ride.customer?.last_name,
  );
  const driverName = ride.driver
    ? formatPersonName(ride.driver.first_name, ride.driver.last_name)
    : null;
  const notes = cleanPickupNotes(ride.pickup_notes);
  const isCanceled = ride.status.includes("canceled");
  const price = ride.final_price ?? ride.price ?? ride.estimated_price ?? null;
  const matchingPaused = ride.matching_paused_at != null;
  const badgeOverride = adminMatchingBadgeOverride(
    ride.matching_paused_at,
    ride.status,
    ride.delay_kind,
  );

  return (
    <>
      <DialogHeader className="pr-8">
        <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
          <span className="font-mono text-sm text-neutral-400">{ride.id}</span>
          <StatusBadge
            status={ride.status}
            showDetailed
            labelOverride={badgeOverride}
          />
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
          <DetailRow label="Options" value={optionsLabel(ride.options)} />
          <DetailRow label="Distance" value={kmLabel(ride.distance)} />
          <DetailRow label="Durée" value={minutesLabel(ride.duration)} />
          <DetailRow label="Prix" value={formatEuro(price)} />
        </Section>

        <Section title="Matching / responsabilité">
          <DetailRow
            label="Deadline"
            value={formatDt(ride.matching_deadline_at)}
          />
          <DetailRow
            label="Pause matching"
            value={pauseLabel(matchingPaused, ride.matching_paused_at)}
          />
          <DetailRow
            label="Type de retard"
            value={delayKindLabel(ride.delay_kind)}
          />
          <DetailRow
            label="Facturation annulation"
            value={cancelBillingLabel(ride.cancel_billing)}
          />
          <DetailRow
            label="Montant frais"
            value={
              ride.cancel_fee_amount == null
                ? "—"
                : formatFeeEuro(Number(ride.cancel_fee_amount))
            }
          />
        </Section>

        <RideFeeSnapshotSection ride={ride} onUpdated={onSnapshotUpdated} />

        <Section title="Donneur d'ordre / compte client">
          <DetailRow label="Nom" value={customerName} />
          <DetailRow label="Téléphone" value={ride.customer?.phone || "—"} />
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
          <DetailRow label="Assigné" value={driverName ?? "Non assigné"} />
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
          <DetailRow label="Pickup notes" value={notes ?? "Aucune note"} />
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
            <DetailRow
              label="Frais client"
              value={cancelBillingLabel(ride.cancel_billing)}
            />
            <DetailRow
              label="Montant"
              value={
                ride.cancel_fee_amount == null
                  ? "—"
                  : formatFeeEuro(Number(ride.cancel_fee_amount))
              }
            />
          </Section>
        ) : null}

        <Section title="Historique des statuts">
          <HistoryList loading={historyLoading} rows={history} />
        </Section>
      </div>
    </>
  );
}

export function RideDetailDialog({
  rideId,
  open,
  onOpenChange,
}: Readonly<{
  rideId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  const [ride, setRide] = useState<RideWithRelations | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [missing, setMissing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!open || !rideId) {
      setRide(null);
      setHistory([]);
      setMissing(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setRide(null);
      setMissing(false);
      setHistoryLoading(true);
      try {
        const result = await fetchRideDetail(rideId);
        if (cancelled) return;
        setRide(result.ride);
        setHistory(result.history);
        setMissing(result.missing);
      } catch {
        if (!cancelled) {
          setRide(null);
          setHistory([]);
          setMissing(true);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, rideId, reloadToken]);

  if (!open) return null;

  if (!ride) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 text-neutral-100">
          <DialogHeader>
            <DialogTitle>Course</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500 py-6">
            {loadingMessage(missing, historyLoading)}
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 text-neutral-100">
        <RideDetailContent
          ride={ride}
          history={history}
          historyLoading={historyLoading}
          onSnapshotUpdated={() => setReloadToken((n) => n + 1)}
        />
      </DialogContent>
    </Dialog>
  );
}

function RideFeeSnapshotSection({
  ride,
  onUpdated,
}: Readonly<{
  ride: RideWithRelations;
  onUpdated: () => void;
}>) {
  const { toast } = useToast();
  const snap = parseFeePolicySnapshot(ride.fee_policy_snapshot);
  const [heartbeat, setHeartbeat] = useState(snap?.heartbeat_minutes ?? 20);
  const [silence, setSilence] = useState(snap?.silence_expire_minutes ?? 20);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHeartbeat(snap?.heartbeat_minutes ?? 20);
    setSilence(snap?.silence_expire_minutes ?? 20);
  }, [snap?.heartbeat_minutes, snap?.silence_expire_minutes]);

  const handleSave = async () => {
    setBusy(true);
    try {
      await patchRideFeeSnapshot(ride.id, ride.fee_policy_snapshot, {
        heartbeat_minutes: heartbeat,
        silence_expire_minutes: silence,
      });
      toast({ title: "Snapshot mis à jour pour cette course" });
      onUpdated();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Impossible de sauver le snapshot",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReapply = async () => {
    setBusy(true);
    try {
      await reapplyPlatformSnapshotToRide(ride.id);
      toast({ title: "Politique plateforme réappliquée" });
      onUpdated();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Impossible de réappliquer la politique",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Section title="Snapshot politique">
        <DetailRow
          label="Heartbeat"
          value={`${snap?.heartbeat_minutes ?? "—"} min`}
        />
        <DetailRow
          label="Silence expire"
          value={`${snap?.silence_expire_minutes ?? "—"} min`}
        />
        <DetailRow
          label="En route avant pickup"
          value={`${snap?.en_route_before_pickup_minutes ?? "—"} min`}
        />
      </Section>
      <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ride-hb">Override heartbeat (min)</Label>
            <Input
              id="ride-hb"
              type="number"
              min={1}
              value={heartbeat}
              onChange={(event) => setHeartbeat(Number(event.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ride-silence">Override silence (min)</Label>
            <Input
              id="ride-silence"
              type="number"
              min={1}
              value={silence}
              onChange={(event) => setSilence(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => void handleSave()}
          >
            Sauver override
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void handleReapply()}
          >
            Réappliquer politique plateforme
          </Button>
        </div>
      </div>
    </div>
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
