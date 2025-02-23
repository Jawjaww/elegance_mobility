"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, MapPin, User } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Database } from "@/lib/database.types"

type DbRide = Database["public"]["Tables"]["rides"]["Row"]
type RideWithDriver = Omit<DbRide, "driver"> & {
  driver: {
    name: string | null
  } | null
}

export function DashboardRecentRides() {
  const [rides, setRides] = useState<RideWithDriver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentRides = async () => {
      try {
        const { data, error } = await supabase
          .from("rides")
          .select(`
            *,
            driver:drivers(name)
          `)
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) throw error

        const formattedRides = (data || []).map((ride) => ({
          ...ride,
          driver: ride.driver?.[0] || null,
        })) as RideWithDriver[]

        setRides(formattedRides)
      } catch (error) {
        console.error("Erreur lors de la récupération des courses récentes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentRides()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      pending: "warning",
      confirmed: "default",
      completed: "success",
      cancelled: "destructive",
    }
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      completed: "Terminée",
      cancelled: "Annulée",
    }
    return (
      <Badge variant={variants[status] || "default"}>{labels[status]}</Badge>
    )
  }

  if (loading) {
    return (
      <Card className="p-6 backdrop-blur-sm">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 rounded-lg bg-neutral-200/20 dark:bg-neutral-800/20" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden p-6 backdrop-blur-sm">
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Dernières courses
        </h3>
        <div className="space-y-6">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="flex flex-col space-y-4 pb-4 last:pb-0 last:border-0 border-b border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <CalendarClock className="h-4 w-4" />
                  <span>
                    {format(new Date(ride.pickup_time), "d MMMM à HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </div>
                {getStatusBadge(ride.status)}
              </div>
              <div className="grid gap-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-neutral-500 dark:text-neutral-400" />
                  <div className="text-sm">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {ride.pickup_address}
                    </div>
                    <div className="text-neutral-600 dark:text-neutral-400">
                      → {ride.dropoff_address}
                    </div>
                  </div>
                </div>
                {ride.driver?.name && (
                  <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <User className="h-4 w-4" />
                    <span>{ride.driver.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-neutral-100/10 dark:to-neutral-800/10"
        aria-hidden="true"
      />
    </Card>
  )
}