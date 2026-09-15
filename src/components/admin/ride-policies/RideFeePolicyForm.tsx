"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Euro, MapPin, Timer } from "lucide-react";
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
  helpGpsWave1,
  helpGpsWave2,
  helpGpsWave3,
  helpHeartbeat,
  helpIncludeOfflineFromWave,
  helpNoShowFlat,
  helpOfferBatchSize,
  helpOfferCooldown,
  helpOfferTtl,
  helpSectionCancel,
  helpSectionDispatch,
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
  gps_wave1_max_age_seconds: number;
  gps_wave2_max_age_seconds: number;
  gps_wave3_max_age_seconds: number;
  dispatch_include_offline_from_wave: number;
  offer_batch_size: number;
  offer_ttl_seconds: number;
  offer_driver_cooldown_seconds: number;
};

type FieldChange = (key: keyof PolicyFormValues, value: number) => void;

const HOUR_S = 3600;
const DAY_S = 86400;

function asPositiveInt(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function withOrderedWaveAges(values: PolicyFormValues): PolicyFormValues {
  const wave1 = Math.max(1, Math.round(values.gps_wave1_max_age_seconds));
  const wave2 = Math.max(wave1, Math.round(values.gps_wave2_max_age_seconds));
  const wave3 = Math.max(wave2, Math.round(values.gps_wave3_max_age_seconds));
  return {
    ...values,
    gps_wave1_max_age_seconds: wave1,
    gps_wave2_max_age_seconds: wave2,
    gps_wave3_max_age_seconds: wave3,
  };
}

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
    gps_wave1_max_age_seconds: asPositiveInt(
      row.gps_wave1_max_age_seconds,
      86400,
    ),
    gps_wave2_max_age_seconds: asPositiveInt(
      row.gps_wave2_max_age_seconds,
      604800,
    ),
    gps_wave3_max_age_seconds: asPositiveInt(
      row.gps_wave3_max_age_seconds,
      2592000,
    ),
    dispatch_include_offline_from_wave: Math.min(
      3,
      Math.max(1, asPositiveInt(row.dispatch_include_offline_from_wave, 3)),
    ),
    offer_batch_size: Math.min(
      3,
      Math.max(1, asPositiveInt(row.offer_batch_size, 2)),
    ),
    offer_ttl_seconds: asPositiveInt(row.offer_ttl_seconds, 90),
    offer_driver_cooldown_seconds: Math.max(
      0,
      Number.isFinite(row.offer_driver_cooldown_seconds)
        ? Math.round(row.offer_driver_cooldown_seconds)
        : 1800,
    ),
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

export function DispatchMatchingFields({
  values,
  onChange,
}: Readonly<{
  values: PolicyFormValues;
  onChange: (next: PolicyFormValues) => void;
}>) {
  const wave1Hours = Math.max(
    1,
    Math.round(values.gps_wave1_max_age_seconds / HOUR_S),
  );
  const wave2Days = Math.max(
    1,
    Math.round(values.gps_wave2_max_age_seconds / DAY_S),
  );
  const wave3Days = Math.max(
    1,
    Math.round(values.gps_wave3_max_age_seconds / DAY_S),
  );
  const cooldownMinutes = Math.max(
    0,
    Math.round(values.offer_driver_cooldown_seconds / 60),
  );

  const patchWaves = (partial: Partial<PolicyFormValues>) => {
    onChange(withOrderedWaveAges({ ...values, ...partial }));
  };

  return (
    <PolicySectionCard
      tone="matching"
      icon={<MapPin className="h-5 w-5" aria-hidden />}
      eyebrow="Matching"
      title="Qui on contacte, vague par vague"
      hint="On épuise le palier proche avant d’élargir. Vague 3 = filet (hors-ligne, GPS jusqu’à ~1 mois). Le score priorise toujours les en-ligne."
      info={<PolicyInfoButton help={helpSectionDispatch()} />}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <PolicyNumberField
          id="gps_wave1_hours"
          label="GPS vague 1"
          gloss="10 km, en ligne"
          unit="h"
          min={1}
          value={wave1Hours}
          onChange={(hours) =>
            patchWaves({ gps_wave1_max_age_seconds: Math.max(1, hours) * HOUR_S })
          }
          hint="Défaut 24 h. Plus un cut à 15 min."
          info={<PolicyInfoButton help={helpGpsWave1(wave1Hours)} />}
        />
        <PolicyNumberField
          id="gps_wave2_days"
          label="GPS vague 2"
          gloss="25 km, en ligne"
          unit="j"
          min={1}
          value={wave2Days}
          onChange={(days) =>
            patchWaves({ gps_wave2_max_age_seconds: Math.max(1, days) * DAY_S })
          }
          hint="Défaut 7 jours."
          info={<PolicyInfoButton help={helpGpsWave2(wave2Days)} />}
        />
        <PolicyNumberField
          id="gps_wave3_days"
          label="GPS vague 3"
          gloss="80 km, filet large"
          unit="j"
          min={1}
          value={wave3Days}
          onChange={(days) =>
            patchWaves({ gps_wave3_max_age_seconds: Math.max(1, days) * DAY_S })
          }
          hint="Défaut 30 jours. Hors-ligne inclus."
          info={<PolicyInfoButton help={helpGpsWave3(wave3Days)} />}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <PolicyNumberField
          id="offer_batch_size"
          label="Taille du lot"
          gloss="Chauffeurs par tick"
          unit=""
          min={1}
          max={3}
          value={values.offer_batch_size}
          onChange={(size) =>
            onChange({
              ...values,
              offer_batch_size: Math.min(3, Math.max(1, Math.round(size))),
            })
          }
          hint="2 par défaut, maximum 3."
          info={
            <PolicyInfoButton help={helpOfferBatchSize(values.offer_batch_size)} />
          }
        />
        <PolicyNumberField
          id="offer_ttl_seconds"
          label="TTL offre"
          gloss="Avant le lot suivant"
          unit="s"
          min={15}
          value={values.offer_ttl_seconds}
          onChange={(seconds) =>
            onChange({
              ...values,
              offer_ttl_seconds: Math.max(15, Math.round(seconds)),
            })
          }
          hint="Défaut 90 s."
          info={
            <PolicyInfoButton help={helpOfferTtl(values.offer_ttl_seconds)} />
          }
        />
        <PolicyNumberField
          id="offer_driver_cooldown_seconds"
          label="Cooldown"
          gloss="Après refus ou timeout"
          unit="min"
          min={0}
          value={cooldownMinutes}
          onChange={(minutes) =>
            onChange({
              ...values,
              offer_driver_cooldown_seconds: Math.max(0, Math.round(minutes)) * 60,
            })
          }
          hint="Levé en vague 3. Défaut 30 min."
          info={<PolicyInfoButton help={helpOfferCooldown(cooldownMinutes)} />}
        />
      </div>
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Hors-ligne dès la vague
            </p>
            <p className="mt-0.5 text-xs text-blue-300/80">
              Avant ce palier, uniquement les chauffeurs en ligne
            </p>
          </div>
          <PolicyInfoButton
            help={helpIncludeOfflineFromWave(
              values.dispatch_include_offline_from_wave,
            )}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((wave) => {
            const selected = values.dispatch_include_offline_from_wave === wave;
            return (
              <Button
                key={wave}
                type="button"
                variant="outline"
                className={
                  selected
                    ? "border-amber-400/60 bg-amber-500/15 text-amber-100"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400"
                }
                onClick={() =>
                  onChange({
                    ...values,
                    dispatch_include_offline_from_wave: wave,
                  })
                }
              >
                Vague {wave}
              </Button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Défaut vague 3. Sans position GPS, le chauffeur reste exclu.
        </p>
      </div>
    </PolicySectionCard>
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
