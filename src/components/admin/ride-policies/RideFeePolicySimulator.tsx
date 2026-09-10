"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatFeeEuro,
  SIMULATOR_SCENARIO_LABELS,
  simulateQuote,
  type CancelQuote,
  type FeePolicySnapshot,
  type QuoteActor,
  type SimulatorScenario,
} from "@/lib/rides/rideFeePolicy";
import { cancelBillingLabel, cancelReasonCodeLabel } from "@/lib/rides/rideCancelLabels";
import { PolicyInfoButton } from "./PolicyInfoButton";
import { helpExamples, helpScenario } from "./policyCopy";
import { PolicySectionCard } from "./policyLayout";

const SCENARIOS = Object.keys(
  SIMULATOR_SCENARIO_LABELS,
) as SimulatorScenario[];

function actorLabel(actor: QuoteActor): string {
  if (actor === "no-show") return "No-show (chauffeur)";
  return "Côté client";
}

function FlagChip({
  ok,
  label,
}: Readonly<{ ok: boolean; label: string }>) {
  return (
    <span
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-xs",
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-neutral-800 bg-neutral-950/50 text-neutral-500",
      )}
    >
      {label}
    </span>
  );
}

function QuoteHero({ quote }: Readonly<{ quote: CancelQuote }>) {
  return (
    <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.08] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-blue-300/90">
        Le client verrait
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-white sm:text-4xl">
        {formatFeeEuro(quote.amount)}
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        {cancelBillingLabel(quote.billing)} ·{" "}
        {cancelReasonCodeLabel(quote.reason_code)}
      </p>
      <p className="mt-2 text-[11px] text-neutral-500">
        Affiché seulement — rien n’est débité tout seul.
      </p>
    </div>
  );
}

export function RideFeePolicySimulator({
  snapshot,
  scenario,
  waitMinutes,
  actor,
  onScenarioChange,
  onWaitChange,
  onActorChange,
}: Readonly<{
  snapshot: FeePolicySnapshot;
  scenario: SimulatorScenario;
  waitMinutes: number;
  actor: QuoteActor;
  onScenarioChange: (next: SimulatorScenario) => void;
  onWaitChange: (next: number) => void;
  onActorChange: (next: QuoteActor) => void;
}>) {
  const quote = simulateQuote(snapshot, scenario, waitMinutes, actor);
  const showWait = scenario === "wait";

  return (
    <PolicySectionCard
      tone="tester"
      icon={<FlaskConical className="h-5 w-5" aria-hidden />}
      eyebrow="Exemples"
      title="Vérifier sans enregistrer"
      hint="Choisissez une situation. Le montant utilise les chiffres des autres onglets, même non enregistrés."
      info={<PolicyInfoButton help={helpExamples()} />}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SCENARIOS.map((id) => {
          const selected = id === scenario;
          const help = helpScenario(id);
          return (
            <div
              key={id}
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2.5",
                selected
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-100"
                  : "border-neutral-800 bg-neutral-950/40 text-neutral-300",
              )}
            >
              <button
                type="button"
                onClick={() => onScenarioChange(id)}
                className="min-w-0 flex-1 text-left text-sm"
              >
                <span className="block font-medium">
                  {SIMULATOR_SCENARIO_LABELS[id]}
                </span>
                <span className="mt-0.5 block text-[11px] text-neutral-400">
                  {help.gloss}
                </span>
              </button>
              <PolicyInfoButton help={help} />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onActorChange("client")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            actor === "client"
              ? "border-blue-500/40 bg-blue-500/15 text-blue-100"
              : "border-neutral-800 text-neutral-400",
          )}
        >
          {actorLabel("client")}
        </button>
        <button
          type="button"
          onClick={() => onActorChange("no-show")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            actor === "no-show"
              ? "border-blue-500/40 bg-blue-500/15 text-blue-100"
              : "border-neutral-800 text-neutral-400",
          )}
        >
          {actorLabel("no-show")}
        </button>
        {showWait ? (
          <div className="flex min-w-[160px] flex-1 items-center gap-2">
            <Label htmlFor="sim-wait" className="shrink-0 text-xs text-neutral-400">
              Attente
            </Label>
            <Input
              id="sim-wait"
              type="number"
              min={0}
              value={waitMinutes}
              onChange={(event) => onWaitChange(Number(event.target.value))}
              className="h-8 tabular-nums"
            />
            <span className="text-xs text-neutral-500">min</span>
          </div>
        ) : null}
      </div>

      <QuoteHero quote={quote} />

      <div className="flex flex-wrap gap-2">
        <FlagChip ok={quote.client_may_cancel} label="Client peut annuler" />
        <FlagChip ok={quote.driver_may_release} label="Chauffeur peut se libérer" />
        <FlagChip ok={quote.driver_may_noshow} label="No-show possible" />
      </div>
    </PolicySectionCard>
  );
}
