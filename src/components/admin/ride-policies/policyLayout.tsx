"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PolicyInfoButton } from "./PolicyInfoButton";
import {
  helpTimelineExpire,
  helpTimelinePause,
  helpTimelinePickup,
  helpTimelineSearch,
} from "./policyCopy";

export type PolicyTone = "matching" | "delays" | "fees" | "tester";

const TONE: Record<
  PolicyTone,
  { shell: string; icon: string; eyebrow: string; chip: string }
> = {
  matching: {
    shell:
      "border-amber-500/30 bg-gradient-to-br from-amber-500/[0.07] to-neutral-900",
    icon: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    eyebrow: "text-amber-300/90",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  },
  delays: {
    shell:
      "border-rose-500/30 bg-gradient-to-br from-rose-500/[0.07] to-neutral-900",
    icon: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    eyebrow: "text-rose-300/90",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-100",
  },
  fees: {
    shell:
      "border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] to-neutral-900",
    icon: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    eyebrow: "text-emerald-300/90",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  },
  tester: {
    shell:
      "border-blue-500/30 bg-gradient-to-br from-blue-500/[0.07] to-neutral-900",
    icon: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    eyebrow: "text-blue-300/90",
    chip: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  },
};

export function PolicySectionCard({
  tone,
  icon,
  eyebrow,
  title,
  hint,
  info,
  children,
}: Readonly<{
  tone: PolicyTone;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  hint: string;
  info?: ReactNode;
  children: ReactNode;
}>) {
  const styles = TONE[tone];
  return (
    <section className={cn("rounded-xl border overflow-hidden", styles.shell)}>
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            styles.icon,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-wide",
              styles.eyebrow,
            )}
          >
            {eyebrow}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {info}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">{hint}</p>
        </div>
      </div>
      <div className="space-y-3 border-t border-white/5 px-4 py-4 sm:px-5">
        {children}
      </div>
    </section>
  );
}

export function PolicyNumberField({
  id,
  label,
  gloss,
  hint,
  unit,
  value,
  onChange,
  info,
  min = 0,
  step = "1",
}: Readonly<{
  id: string;
  label: string;
  gloss: string;
  hint: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
  info?: ReactNode;
  min?: number;
  step?: string;
}>) {
  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <label
            htmlFor={id}
            className="text-[11px] font-medium uppercase tracking-wide text-neutral-500"
          >
            {label}
          </label>
          <p className="mt-0.5 text-xs text-blue-300/80">{gloss}</p>
        </div>
        {info}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11 border-neutral-800 bg-neutral-950 text-2xl font-semibold tabular-nums"
        />
        <span className="shrink-0 text-sm text-neutral-500">{unit}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">{hint}</p>
    </div>
  );
}

export function PolicyChip({
  tone,
  label,
  gloss,
  value,
}: Readonly<{
  tone: PolicyTone;
  label: string;
  gloss: string;
  value: string;
}>) {
  const styles = TONE[tone];
  return (
    <div className={cn("min-w-0 rounded-xl border px-3 py-2", styles.chip)}>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[10px] leading-snug opacity-70">
        {gloss}
      </p>
    </div>
  );
}

export function MatchingTimeline({
  heartbeat,
  silence,
}: Readonly<{ heartbeat: number; silence: number }>) {
  const steps = [
    {
      id: "search",
      n: "1",
      label: "Recherche",
      hint: "On cherche un chauffeur",
      help: helpTimelineSearch(),
    },
    {
      id: "pickup",
      n: "2",
      label: "Heure prévue",
      hint: "Prise en charge",
      help: helpTimelinePickup(),
    },
    {
      id: "pause",
      n: "3",
      label: "On demande",
      hint: `Après +${heartbeat} min`,
      help: helpTimelinePause(heartbeat),
    },
    {
      id: "expire",
      n: "4",
      label: "On arrête",
      hint: `Sans réponse +${silence} min`,
      help: helpTimelineExpire(silence),
    },
  ];

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((step) => (
        <li
          key={step.id}
          className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-2"
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-300/80">
              {step.n}. {step.label}
            </p>
            <PolicyInfoButton help={step.help} />
          </div>
          <p className="mt-1 text-[11px] leading-snug text-neutral-400">
            {step.hint}
          </p>
        </li>
      ))}
    </ol>
  );
}
