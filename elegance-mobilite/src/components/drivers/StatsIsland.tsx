'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Calendar, TrendingUp, Eye } from "lucide-react"

type StatsPeriod = 'today' | 'week' | 'month'

interface StatsIslandProps {
  todayStats: {
    rides: number
    earnings: number
    hours: number
    rating: number
  }
  weekStats: {
    rides: number
    earnings: number
    hours: number
    rating: number
  }
  monthStats: {
    rides: number
    earnings: number
    hours: number
    rating: number
  }
}

export function StatsIsland({ todayStats, weekStats, monthStats }: StatsIslandProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>('today')

  const getCurrentStats = () => {
    switch (selectedPeriod) {
      case 'today':
        return todayStats
      case 'week':
        return weekStats
      case 'month':
        return monthStats
    }
  }

  const currentStats = getCurrentStats()

  const periods = [
    { key: 'today' as const, label: 'Aujourd\'hui' },
    { key: 'week' as const, label: 'Cette semaine' },
    { key: 'month' as const, label: 'Ce mois' },
  ]

  // Format intelligent du temps (heures/minutes)
  const formatSmartTime = (hours: number) => {
    const h = Math.floor(hours)
    const min = Math.round((hours - h) * 60)
    if (h > 0 && min > 0) return `${h}h${min}min`
    if (h > 0) return `${h}h`
    if (min > 0) return `${min}min`
    return '0min'
  }

  return (
    <Card className="border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
      <CardContent className="p-4">
        {/* Sélecteur de période */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-neutral-200">Performance</span>
          </div>
          <div className="flex bg-neutral-800 rounded-lg p-1">
            {periods.map((period) => (
              <Button
                key={period.key}
                variant="ghost"
                size="sm"
                className={`text-xs px-3 py-1 h-7 ${
                  selectedPeriod === period.key
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Statistiques compactes */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {currentStats.rides}
            </div>
            <div className="text-xs text-neutral-400">Courses</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-green-400">
              {formatCurrency(currentStats.earnings)}
            </div>
            <div className="text-xs text-neutral-400">Gains</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-400">
              {formatSmartTime(currentStats.hours)}
            </div>
            <div className="text-xs text-neutral-400">Temps</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-amber-400">
              {currentStats.rating.toFixed(1)}
            </div>
            <div className="text-xs text-neutral-400">Note</div>
          </div>
        </div>

        {/* Indicateur de tendance */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-neutral-800">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-neutral-400 hover:text-neutral-200 h-6"
          >
            <Eye className="h-3 w-3 mr-1" />
            Voir le détail
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
