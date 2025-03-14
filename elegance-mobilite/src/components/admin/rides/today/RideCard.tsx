"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeliveryRun } from "@/lib/stores/runsStore"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, Phone, Mail, Clock, AlertCircle as AlertIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface RideCardProps {
  run: DeliveryRun
  onClick?: (run: DeliveryRun) => void
  className?: string
}

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-500" },
  assigned: { label: "Assignée", color: "bg-blue-500" },
  in_progress: { label: "En cours", color: "bg-green-500" },
  completed: { label: "Terminée", color: "bg-neutral-500" },
  canceled: { label: "Annulée", color: "bg-red-500" },
}

export function RideCard({ run, onClick, className }: RideCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={() => onClick?.(run)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neutral-500" />
              <p className="font-medium">{run.delivery_address}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500" />
              <p className="text-sm text-neutral-600">
                {format(run.time_window_start, "HH:mm", { locale: fr })} -{" "}
                {format(run.time_window_end, "HH:mm", { locale: fr })}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn("ml-2", statusConfig[run.status].color)}
          >
            {statusConfig[run.status].label}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-medium">{run.customer_name}</p>
          </div>
          {run.customer_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-neutral-500" />
              <p className="text-sm text-neutral-600">{run.customer_phone}</p>
            </div>
          )}
          {run.customer_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-500" />
              <p className="text-sm text-neutral-600">{run.customer_email}</p>
            </div>
          )}
          {run.delivery_notes && (
            <div className="flex items-start gap-2">
              <AlertIcon className="h-4 w-4 text-neutral-500" />
              <p className="text-sm text-neutral-600">{run.delivery_notes}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
