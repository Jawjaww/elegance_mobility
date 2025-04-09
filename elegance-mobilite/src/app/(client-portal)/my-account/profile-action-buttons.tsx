'use client';

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarClock, MapPin, Settings, ChevronRight } from "lucide-react";

export default function ProfileActionButtons() {
  const router = useRouter();

  const actions = [
    {
      title: "Mes réservations",
      description: "Consultez l'historique et le statut de vos courses",
      icon: CalendarClock,
      href: "/my-account/reservations",
      color: "text-blue-400",
    },
    {
      title: "Paramètres du compte",
      description: "Gérez vos informations personnelles",
      icon: Settings,
      href: "/my-account/settings",
      color: "text-emerald-400",
    },
  ];

  return (
    <>
      {actions.map((action) => (
        <Card
          key={action.href}
          className="bg-neutral-900 border-neutral-800 p-4 hover:bg-neutral-800 cursor-pointer transition-colors"
          onClick={() => router.push(action.href)}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full bg-opacity-20 ${action.color.replace(
                "text",
                "bg"
              )}`}
            >
              <action.icon className={`h-6 w-6 ${action.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{action.title}</h3>
              <p className="text-sm text-neutral-400">{action.description}</p>
            </div>
            <ChevronRight className="h-6 w-6 text-neutral-600" />
          </div>
        </Card>
      ))}
    </>
  );
}