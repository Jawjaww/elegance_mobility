'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, CreditCard, CheckCircle } from "lucide-react"
import type { DbRide } from "@/lib/types/common.types"

interface DailyStatsProps {
  rides: DbRide[]
}

export function DailyStats({ rides }: DailyStatsProps) {
  // Calculer les statistiques
  const stats = rides.reduce((acc, ride) => {
    if (ride.status === 'completed') {
      acc.completedRides++
      acc.totalEarnings += ride.final_price || 0
      acc.totalDistance += ride.distance || 0
    }
    return acc
  }, {
    completedRides: 0,
    totalEarnings: 0,
    totalDistance: 0
  })

  const remainingRides = rides.filter(
    ride => ['assigned', 'accepted', 'in_progress'].includes(ride.status)
  ).length

  const statItems = [
    {
      icon: CheckCircle,
      label: "Courses terminées",
      value: `${stats.completedRides}`,
      color: "text-green-500"
    },
    {
      icon: MapPin,
      label: "Courses restantes",
      value: `${remainingRides}`,
      color: "text-blue-500"
    },
    {
      icon: CreditCard,
      label: "Gains du jour",
      value: `${stats.totalEarnings.toFixed(2)}€`,
      color: "text-purple-500"
    },
    {
      icon: Clock,
      label: "Distance totale",
      value: `${(stats.totalDistance / 1000).toFixed(1)}km`,
      color: "text-orange-500"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-4 p-6">
            <item.icon className={`h-8 w-8 ${item.color}`} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className="text-2xl font-bold">
                {item.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}