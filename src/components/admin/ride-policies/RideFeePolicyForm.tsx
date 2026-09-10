"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Euro, Timer } from "lucide-react";
import {
  FEE_TIER_KINDS,
  TIER_KIND_LABELS,
  type FeePolicyTier,
  type FeeTierKind,
} from "@/lib/rides/rideFeePolicy";
import type { Database } from "@/lib/types/database.types";
import { PolicyInfoButton } from "./PolicyInfoButton";
import {
  helpCancelAfterArrivalFlat,
  helpDriverLate,
  helpEnRoute,
  helpHeartbeat,
  helpNoShowFlat,
  helpSectionCancel,
  helpSectionHeartbeat,
  helpSilence,
  helpWaitGrace,
  helpWaitMax,
  TIER_HELP,
} from "./policyCopy";
import {
  MatchingTimeline,
  PolicyNumberField,
  PolicySectionCard,
} from "./policyLayout";

type PolicyRow = Database["public"]["Tables"]["ride_fee_policies"]["Row"];

export type PolicyFormValues = {
  name: string;
  heartbeat_minutes: number;
  silence_expire_minutes: number;
  en_route_before_pickup_minutes: number;
  driver_late_grace_minutes: number;
  wait_grace_minutes: number;
  wait_max_minutes: number;
  no_show_flat: number;
  cancel_after_arrival_flat: number;
};

type FieldChange = (key: keyof PolicyFormValues, value: number) => void;

export function policyRowToForm(row: PolicyRow): PolicyFormValues {
  return {
    name: row.name,
    heartbeat_minutes: row.heartbeat_minutes,
    silence_expire_minutes: row.silence_expire_minutes,
    en_route_before_pickup_minutes: row.en_route_before_pickup_minutes,
    driver_late_grace_minutes: row.driver_late_grace_minutes,
    wait_grace_minutes: row.wait_grace_minutes,
    wait_max_minutes: row.wait_max_minutes,
    no_show_flat: Number(row.no_show_flat),
    cancel_after_arrival_flat: Number(row.cancel_after_arrival_flat),
  };
}

function emptyTier(kind: FeeTierKind): FeePolicyTier {
  return {
    id: crypto.randomUUID(),
    kind,
    after_minutes: 0,
    fee_flat: 0,
    fee_per_minute: 0,
  };
}

export function withStableTierIds(tiers: FeePolicyTier[]): FeePolicyTier[] {
  return tiers.map((tier) => ({
    ...tier,
    id: tier.id ?? crypto.randomUUID(),
  }));
}

function updateTierById(
  tiers: FeePolicyTier[],
  id: string,
  patch: Partial<FeePolicyTier>,
): FeePolicyTier[] {
  return tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier));
}

function isKeyedTier(
  tier: FeePolicyTier,
): tier is FeePolicyTier & { id: string } {
  return typeof tier.id === "string" && tier.id.length > 0;
}

function setNumber(
  values: PolicyFormValues,
  onChange: (next: PolicyFormValues) => void,
): FieldChange {
  return (key, value) => onChange({ ...values, [key]: value });
}

function FeeTierRow({
  tier,
  tiers,
  onTiersChange,
}: Readonly<{
  tier: FeePolicyTier & { id: string };
  tiers: FeePolicyTier[];
  onTiersChange: (next: FeePolicyTier[]) => void;
}>) {
  const rowId = tier.id;
  return (
    <div className="grid gap-2 rounded-lg border border-neutral-800 bg-neutral-950/50 p-3 sm:grid-cols-4">
      <div className="space-y-1.5">
        <Label>Après (min)</Label>
        <Input
          type="number"
          min={0}
          value={tier.after_minutes}
          onChange={(event) =>
            onTiersChange(
              updateTierById(tiers, rowId, {
                after_minutes: Number(event.target.value),
              }),
            )
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>Forfait €</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={tier.fee_flat}
          onChange={(event) =>
            onTiersChange(
              updateTierById(tiers, rowId, {
                fee_flat: Number(event.target.value),
              }),
            )
          }
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>€ / min ensuite</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={tier.fee_per_minute}
            onChange={(event) =>
              onTiersChange(
                updateTierById(tiers, rowId, {
                  fee_per_minute: Number(event.target.value),
                }),
              )
            }
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-red-500/40 text-red-300"
            onClick={() =>
              onTiersChange(tiers.filter((row) => row.id !== rowId))
            }
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
}

function TierKindGroup({
  kind,
  tiers,
  onTiersChange,
}: Readonly<{
  kind: FeeTierKind;
  tiers: FeePolicyTier[];
  onTiersChange: (next: FeePolicyTier[]) => void;
}>) {
  const rows = tiers.filter(
    (tier): tier is FeePolicyTier & { id: string } =>
      isKeyedTier(tier) && tier.kind === kind,
  );

  return (
    <div className="space-y-2 rounded-xl border border-neutral-800/80 bg-neutral-950/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-300/80">
            {TIER_KIND_LABELS[kind]}
          </p>
          <PolicyInfoButton help={TIER_HELP[kind]()} />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-emerald-500/30 text-emerald-200"
          onClick={() => onTiersChange([...tiers, emptyTier(kind)])}
        >
          Ajouter
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-neutral-500">
          Aucun palier — seul le forfait éventuel s&apos;applique.
        </p>
      ) : (
        rows.map((tier) => (
          <FeeTierRow
            key={tier.id}
            tier={tier}
            tiers={tiers}
            onTiersChange={onTiersChange}
          />
        ))
      )}
    </div>
  );
}

export function MatchingPolicyFields({
  values,
  onChange,
}: Readonly<{
  values: PolicyFormValues;
  onChange: (next: PolicyFormValues) => void;
}>) {
  const patch = setNumber(values, onChange);
  return (
    <PolicySectionCard
      tone="matching"
      icon={<Timer className="h-5 w-5" aria-hidden />}
      eyebrow="Heartbeat"
      title="Combien de temps on cherche"
      hint="Tant que le client confirme, on cherche. Un silence après la pause ferme la course sans frais."
      info={<PolicyInfoButton help={helpSectionHeartbeat()} />}
    >
      <MatchingTimeline
        heartbeat={values.heartbeat_minutes}
        silence={values.silence_expire_minutes}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <PolicyNumberField
          id="heartbeat_minutes"
          label="Heartbeat"
          gloss="Durée d’un cycle de recherche"
          unit="min"
          min={1}
          value={values.heartbeat_minutes}
          onChange={(value) => patch("heartbeat_minutes", value)}
          hint="Cran de deadline, confirmation et bonus."
          info={<PolicyInfoButton help={helpHeartbeat(values.heartbeat_minutes)} />}
        />
        <PolicyNumberField
          id="silence_expire_minutes"
          label="Silence"
          gloss="Délai sans réponse après la pause"
          unit="min"
          min={1}
          value={values.silence_expire_minutes}
          onChange={(value) => patch("silence_expire_minutes", value)}
          hint="Sans réponse → la course est annulée, 0 €."
          info={
            <PolicyInfoButton
              help={helpSilence(values.silence_expire_minutes)}
            />
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="policy-name">Nom interne</Label>
        <Input
          id="policy-name"
          value={values.name}
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
          }
        />
      </div>
    </PolicySectionCard>
  );
}

export function DelayPolicyFields({
  values,
  onChange,
}: Readonly<{
  values: PolicyFormValues;
  onChange: (next: PolicyFormValues) => void;
}>) {
  const patch = setNumber(values, onChange);
  return (
    <PolicySectionCard
      tone="delays"
      icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
      eyebrow="Retards"
      title="Qui attend, qui se libère"
      hint="Chauffeur en retard (pas arrivé) ≠ client en retard (chauffeur déjà là)."
      info={<PolicyInfoButton help={helpSectionCancel()} />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <PolicyNumberField
          id="en_route_before_pickup_minutes"
          label="En route"
          gloss="Le chauffeur est déjà parti (ou presque)"
          unit="min"
          value={values.en_route_before_pickup_minutes}
          onChange={(value) =>
            patch("en_route_before_pickup_minutes", value)
          }
          hint="Prise en charge dans ce délai, GPS, ou arrivée → palier en route."
          info={
            <PolicyInfoButton
              help={helpEnRoute(values.en_route_before_pickup_minutes)}
            />
          }
        />
        <PolicyNumberField
          id="driver_late_grace_minutes"
          label="Grâce chauffeur"
          gloss="Retard du chauffeur, pas encore arrivé"
          unit="min"
          value={values.driver_late_grace_minutes}
          onChange={(value) => patch("driver_late_grace_minutes", value)}
          hint="Heure prévue + grâce, pas arrivé → client 0 €, chauffeur peut se libérer."
          info={
            <PolicyInfoButton
              help={helpDriverLate(values.driver_late_grace_minutes)}
            />
          }
        />
        <PolicyNumberField
          id="wait_grace_minutes"
          label="Grâce d’attente"
          gloss="Minutes offertes une fois le chauffeur arrivé"
          unit="min"
          value={values.wait_grace_minutes}
          onChange={(value) => patch("wait_grace_minutes", value)}
          hint="Après « je suis arrivé », ces minutes sont à 0 €."
          info={
            <PolicyInfoButton help={helpWaitGrace(values.wait_grace_minutes)} />
          }
        />
        <PolicyNumberField
          id="wait_max_minutes"
          label="Attente max"
          gloss="Ensuite, client considéré absent (no-show)"
          unit="min"
          value={values.wait_max_minutes}
          onChange={(value) => patch("wait_max_minutes", value)}
          hint="Au-delà, le chauffeur peut marquer le no-show."
          info={
            <PolicyInfoButton help={helpWaitMax(values.wait_max_minutes)} />
          }
        />
      </div>
    </PolicySectionCard>
  );
}

export function FeesPolicyFields({
  values,
  tiers,
  onChange,
  onTiersChange,
}: Readonly<{
  values: PolicyFormValues;
  tiers: FeePolicyTier[];
  onChange: (next: PolicyFormValues) => void;
  onTiersChange: (next: FeePolicyTier[]) => void;
}>) {
  const patch = setNumber(values, onChange);
  return (
    <PolicySectionCard
      tone="fees"
      icon={<Euro className="h-5 w-5" aria-hidden />}
      eyebrow="Frais affichés"
      title="Montants calculés, pas débités"
      hint="Chaque course fige ses règles. Modifier ici ne change pas les réservations déjà créées. Rien n’est débité tout seul."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <PolicyNumberField
          id="no_show_flat"
          label="No-show"
          gloss="Client absent après l’arrivée du chauffeur"
          unit="€"
          step="0.01"
          value={values.no_show_flat}
          onChange={(value) => patch("no_show_flat", value)}
          hint="Forfait ajouté au palier no-show. Affiché seulement."
          info={<PolicyInfoButton help={helpNoShowFlat(values.no_show_flat)} />}
        />
        <PolicyNumberField
          id="cancel_after_arrival_flat"
          label="Forfait après arrivée"
          gloss="Le client annule alors que le chauffeur est sur place"
          unit="€"
          step="0.01"
          value={values.cancel_after_arrival_flat}
          onChange={(value) => patch("cancel_after_arrival_flat", value)}
          hint="S’ajoute aux paliers d’attente si le client annule après arrivée."
          info={
            <PolicyInfoButton
              help={helpCancelAfterArrivalFlat(values.cancel_after_arrival_flat)}
            />
          }
        />
      </div>
      <div className="space-y-3">
        {FEE_TIER_KINDS.map((kind) => (
          <TierKindGroup
            key={kind}
            kind={kind}
            tiers={tiers}
            onTiersChange={onTiersChange}
          />
        ))}
      </div>
    </PolicySectionCard>
  );
}
