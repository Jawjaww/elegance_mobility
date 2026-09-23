"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, MapPin } from "lucide-react";
import {
  EMPTY_QUEUE_PREVIEW,
  loadDelayedQueue,
  loadUpcomingQueue,
  type QueuePreview,
} from "@/lib/dashboard/ridesQueueSummary";
import { cn } from "@/lib/utils";

function QueueCard({
  title,
  href,
  preview,
  tone,
  icon,
  loading = false,
}: Readonly<{
  title: string;
  href: string;
  preview: QueuePreview;
  tone: "pending" | "urgent";
  icon: ReactNode;
  loading?: boolean;
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
        {loading ? (
          // Placeholders sized like the values they replace, so the card does not resize when
          // the count arrives. The count used to render as a real "0" from its initial state,
          // which read as "nothing is waiting" for as long as the request took — a wrong
          // answer shown confidently, not just a slow one.
          <div aria-hidden className="animate-pulse">
            <div className={cn("h-6 rounded bg-white/10 mt-0.5", "w-10")} />
            <div className="h-3 rounded bg-white/10 mt-1 w-24" />
          </div>
        ) : (
          <>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums leading-none mt-0.5",
                styles.count,
              )}
            >
              {preview.count}
            </p>
            <p className={cn("text-[11px] mt-1 truncate", styles.hint)}>
              {preview.pickupTime
                ? format(new Date(preview.pickupTime), "EEE d MMM · HH:mm", {
                    locale: fr,
                  })
                : "Aucune"}
            </p>
          </>
        )}
      </div>
    </Link>
  );
}

export function RidesQueueSummary() {
  const [upcoming, setUpcoming] = useState<QueuePreview>(EMPTY_QUEUE_PREVIEW);
  const [delayed, setDelayed] = useState<QueuePreview>(EMPTY_QUEUE_PREVIEW);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [nextUpcoming, nextDelayed] = await Promise.all([
        loadUpcomingQueue(),
        loadDelayedQueue(),
      ]);
      setUpcoming(nextUpcoming);
      setDelayed(nextDelayed);
    } catch (error) {
      console.error("Error loading rides queue summary:", error);
      setUpcoming(EMPTY_QUEUE_PREVIEW);
      setDelayed(EMPTY_QUEUE_PREVIEW);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    // Each card owns its own request, so the two counts arrive independently instead of the
    // grid waiting on the slower one.
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <QueueCard
        title="Prochaine"
        href="/backoffice-portal/rides?filter=pending"
        preview={upcoming}
        tone="pending"
        icon={<MapPin className="h-4 w-4" aria-hidden />}
        loading={loading}
      />
      <QueueCard
        title="En retard"
        href="/backoffice-portal/rides?filter=delayed"
        preview={delayed}
        tone="urgent"
        icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
        loading={loading}
      />
    </div>
  );
}
