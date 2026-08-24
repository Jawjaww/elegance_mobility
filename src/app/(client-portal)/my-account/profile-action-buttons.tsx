"use client";

import { useRouter } from "next/navigation";
import { CalendarClock, Settings, ChevronRight } from "lucide-react";
import {
  ACCOUNT_ICON_WRAP,
  ACCOUNT_ROW,
} from "@/components/account/accountUi";

export default function ProfileActionButtons() {
  const router = useRouter();

  const actions = [
    {
      title: "Mes réservations",
      description: "Consultez l'historique et le statut de vos courses",
      icon: CalendarClock,
      href: "/my-account/reservations",
    },
    {
      title: "Paramètres du compte",
      description: "Gérez vos informations personnelles",
      icon: Settings,
      href: "/my-account/settings",
    },
  ];

  return (
    <>
      {actions.map((action) => (
        <button
          key={action.href}
          type="button"
          className={`${ACCOUNT_ROW} w-full text-left`}
          onClick={() => router.push(action.href)}
        >
          <div className={ACCOUNT_ICON_WRAP}>
            <action.icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-100">{action.title}</h3>
            <p className="text-sm text-neutral-400">{action.description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-neutral-500" aria-hidden />
        </button>
      ))}
    </>
  );
}
