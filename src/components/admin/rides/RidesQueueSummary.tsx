"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/lib/database/client";
import { overdueUnassignedOrFilter } from "@/lib/dashboard/adminDashboard";
import { cn } from "@/lib/utils";

type QueuePreview = {
  count: number;
  pickupTime: string | null;
};

const EMPTY: QueuePreview = { count: 0, pickupTime: null };

async function loadUpcoming(): Promise<QueuePreview> {
  const nowIso = new Date().toISOString();
  const [{ count }, { data }] = await Promise.all([
    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gte("pickup_time", nowIso),
    supabase
      .from("rides")
      .select("pickup_time")
      .eq("status", "pending")
      .gte("pickup_time", nowIso)
      .order("pickup_time", { ascending: true })
      .limit(1),
  ]);
  return {
    count: count ?? 0,
    pickupTime: data?.[0]?.pickup_time ?? null,
  };
}

async function loadDelayed(): Promise<QueuePreview> {
  const orFilter = overdueUnassignedOrFilter(new Date().toISOString());
  const [{ count }, { data }] = await Promise.all([
    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .or(orFilter),
    supabase
      .from("rides")
      .select("pickup_time")
      .or(orFilter)
      .order("pickup_time", { ascending: true })
      .limit(1),
  ]);
  return {
    count: count ?? 0,
    pickupTime: data?.[0]?.pickup_time ?? null,
  };
}

function QueueCard({
  title,
  href,
  preview,
  tone,
  icon,
}: Readonly<{
  title: string;
  href: string;
  preview: QueuePreview;
  tone: "pending" | "urgent";
  icon: ReactNode;
}>) {
  const styles =
    tone === "urgent"
      ? {
          shell: "border-rose-500/35 bg-rose-500/[0.06]",
          icon: "bg-rose-500/15 text-rose-400",
          count: "text-rose-100",
          hint: "text-rose-300/80",
        }
      : {
          shell: "border-amber-500/35 bg-amber-500/[0.06]",
          icon: "bg-amber-500/15 text-amber-400",
          count: "text-amber-100",
          hint: "text-amber-300/80",
        };

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-3 min-w-0 hover:bg-white/[0.03] transition-colors",
        styles.shell,
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          styles.icon,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-400">{title}</p>
        <p className={cn("text-2xl font-bold tabular-nums leading-none mt-0.5", styles.count)}>
          {preview.count}
        </p>
        <p className={cn("text-[11px] mt-1 truncate", styles.hint)}>
          {preview.pickupTime
            ? format(new Date(preview.pickupTime), "EEE d MMM · HH:mm", {
                locale: fr,
              })
            : "Aucune"}
        </p>
      </div>
    </Link>
  );
}

export function RidesQueueSummary() {
  const [upcoming, setUpcoming] = useState<QueuePreview>(EMPTY);
  const [delayed, setDelayed] = useState<QueuePreview>(EMPTY);

  const load = useCallback(async () => {
    try {
      const [nextUpcoming, nextDelayed] = await Promise.all([
        loadUpcoming(),
        loadDelayed(),
      ]);
      setUpcoming(nextUpcoming);
      setDelayed(nextDelayed);
    } catch (error) {
      console.error("Error loading rides queue summary:", error);
      setUpcoming(EMPTY);
      setDelayed(EMPTY);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <QueueCard
        title="Prochaine"
        href="/backoffice-portal/rides?filter=pending"
        preview={upcoming}
        tone="pending"
        icon={<MapPin className="h-4 w-4" aria-hidden />}
      />
      <QueueCard
        title="En retard"
        href="/backoffice-portal/rides?filter=delayed"
        preview={delayed}
        tone="urgent"
        icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
      />
    </div>
  );
}
