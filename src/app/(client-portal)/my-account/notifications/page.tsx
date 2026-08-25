"use client";

import { useEffect, useState } from "react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ClientPushSetup } from "@/components/account/ClientPushSetup";
import { ACCOUNT_CARD, ACCOUNT_PAGE } from "@/components/account/accountUi";
import { cn } from "@/lib/utils";
import {
  fetchUserNotifications,
  markNotificationRead,
} from "@/lib/services/pushTokenService";
import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import { formatDateTime } from "@/lib/utils/date-format";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

function NotificationList({
  notifications,
  onMarkRead,
}: Readonly<{
  notifications: NotificationRow[];
  onMarkRead: (id: string) => void;
}>) {
  if (notifications.length === 0) {
    return <p className="text-sm text-neutral-400">Aucune notification.</p>;
  }

  return (
    <ul className="space-y-3">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={cn(
            "rounded-lg border px-3 py-3",
            n.is_read
              ? "border-neutral-800 bg-neutral-900/40"
              : "border-blue-500/30 bg-blue-500/5",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-neutral-100">{n.title}</p>
              <p className="text-sm text-neutral-400 mt-1">{n.message}</p>
              <p className="text-xs text-neutral-500 mt-2">
                {formatDateTime(n.created_at)}
              </p>
            </div>
            {!n.is_read ? (
              <button
                type="button"
                className="text-xs text-blue-300 hover:text-blue-200 shrink-0"
                onClick={() => {
                  onMarkRead(n.id);
                }}
              >
                Lu
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const rows = await fetchUserNotifications(user.id);
      if (mounted) {
        setNotifications(rows);
        setLoading(false);
      }
    }

    void load();

    const channel = supabase
      .channel("client-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((prev) => [
            payload.new as NotificationRow,
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
      ),
    );
  };

  return (
    <div className={ACCOUNT_PAGE}>
      <AccountPageHeader
        title="Notifications"
        description="Alertes course et préférences push"
        backHref="/my-account"
      />

      <div className={cn(ACCOUNT_CARD, "p-5 sm:p-6 mb-4")}>
        <ClientPushSetup />
      </div>

      <div className={cn(ACCOUNT_CARD, "p-5 sm:p-6")}>
        <h2 className="text-sm font-semibold text-neutral-200 mb-4">
          Historique
        </h2>
        {loading ? (
          <p className="text-sm text-neutral-400">Chargement…</p>
        ) : (
          <NotificationList
            notifications={notifications}
            onMarkRead={handleMarkRead}
          />
        )}
      </div>
    </div>
  );
}
