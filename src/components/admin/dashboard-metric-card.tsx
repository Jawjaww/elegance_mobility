"use client";

import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricTone = "default" | "highlighted" | "pending";

interface DashboardMetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  href?: string;
  className?: string;
  /** @deprecated Prefer tone="highlighted" */
  highlighted?: boolean;
  tone?: MetricTone;
  subtitle?: string;
}

const TONE_SURFACE: Record<MetricTone, string> = {
  default: "bg-neutral-900 border-neutral-800 hover:border-neutral-700",
  highlighted:
    "bg-blue-950/40 border-blue-500/20 hover:border-blue-500/40",
  pending:
    "bg-amber-500/5 border-amber-500/40 hover:border-amber-500/60",
};

const TONE_ICON: Record<MetricTone, string> = {
  default: "bg-neutral-800 border-neutral-700 text-neutral-300",
  highlighted: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  pending: "bg-amber-500/10 border-amber-500/30 text-amber-400",
};

export function DashboardMetricCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  href,
  className,
  highlighted = false,
  tone,
  subtitle,
}: Readonly<DashboardMetricCardProps>) {
  const resolvedTone: MetricTone =
    tone ?? (highlighted ? "highlighted" : "default");

  const content = (
    <div
      className={cn(
        "relative p-5 sm:p-6 overflow-hidden rounded-xl border transition-all duration-200",
        TONE_SURFACE[resolvedTone],
        href && "cursor-pointer",
        className,
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-semibold text-white tabular-nums">
              {value}
            </p>
            {trend != null && (
              <span
                className={cn(
                  "text-xs font-medium inline-flex items-center gap-0.5",
                  trendUp ? "text-emerald-400" : "text-red-400",
                )}
              >
                {trendUp ? (
                  <ArrowUpIcon className="h-3 w-3" aria-hidden />
                ) : (
                  <ArrowDownIcon className="h-3 w-3" aria-hidden />
                )}
                {trend}
              </span>
            )}
          </div>
          {subtitle ? (
            <p className="text-xs text-neutral-500 mt-1.5">{subtitle}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
            TONE_ICON[resolvedTone],
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
