"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type OpsPanelTone = "pending" | "live" | "fleet" | "default";

const TONE_STYLES: Record<
  OpsPanelTone,
  { shell: string; icon: string; count: string; action: string }
> = {
  pending: {
    shell: "border-amber-500/35 bg-gradient-to-br from-amber-500/[0.07] to-neutral-900",
    icon: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    count: "text-amber-100",
    action: "border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
  },
  live: {
    shell: "border-blue-500/30 bg-gradient-to-br from-blue-500/[0.07] to-neutral-900",
    icon: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    count: "text-blue-100",
    action: "border-blue-500/40 text-blue-300 hover:bg-blue-500/10",
  },
  fleet: {
    shell: "border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] to-neutral-900",
    icon: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    count: "text-emerald-100",
    action: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
  },
  default: {
    shell: "border-neutral-800 bg-neutral-900",
    icon: "bg-neutral-800 border-neutral-700 text-neutral-300",
    count: "text-white",
    action: "border-neutral-700 text-neutral-300 hover:bg-neutral-800",
  },
};

type DashboardOpsPanelProps = Readonly<{
  title: string;
  count: number;
  subtitle?: string;
  icon: React.ReactNode;
  tone: OpsPanelTone;
  href: string;
  linkLabel?: string;
  loading: boolean;
  emptyMessage: string;
  children: React.ReactNode;
  className?: string;
}>;

export function DashboardOpsPanel({
  title,
  count,
  subtitle,
  icon,
  tone,
  href,
  linkLabel = "Voir tout",
  loading,
  emptyMessage,
  children,
  className,
}: DashboardOpsPanelProps) {
  const styles = TONE_STYLES[tone];
  const hasItems = !loading && count > 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border overflow-hidden h-fit",
        styles.shell,
        className,
      )}
    >
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
              styles.icon,
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-400">{title}</p>
            <p
              className={cn(
                "text-3xl font-bold tabular-nums mt-0.5 leading-none",
                styles.count,
              )}
            >
              {loading ? "—" : count}
            </p>
            {subtitle ? (
              <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className={cn("shrink-0 h-8", styles.action)}
        >
          <Link href={href}>{linkLabel}</Link>
        </Button>
      </div>

      {loading || hasItems ? (
        <>
          <Separator className="bg-neutral-800/80" />
          <div
            className={cn(
              "px-4 sm:px-5 py-3",
              hasItems && "max-h-[min(42vh,360px)] overflow-y-auto",
            )}
          >
            {loading ? (
              <div className="space-y-2">
                <div className="h-12 animate-pulse rounded-lg bg-neutral-800/80" />
                <div className="h-12 animate-pulse rounded-lg bg-neutral-800/80" />
              </div>
            ) : (
              <div className="space-y-0.5">{children}</div>
            )}
          </div>
        </>
      ) : (
        <p className="px-4 sm:px-5 pb-4 text-xs text-neutral-500">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}
