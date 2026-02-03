'use client'

import { DollarSign, Route, Star, Clock } from 'lucide-react'
import { useDriverStore } from '@/lib/driver/store'
import { formatPrice } from '@/lib/driver/utils'

export function Stats() {
  const { stats } = useDriverStore()

  const items: StatCardProps[] = [
    { icon: Route, value: String(stats.todayRides), label: 'Courses', color: 'blue' },
    { icon: DollarSign, value: formatPrice(stats.todayEarnings), label: 'Gains', color: 'emerald' },
    { icon: Star, value: stats.rating > 0 ? stats.rating.toFixed(1) : '--', label: 'Note', color: 'yellow' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  )
}

export interface StatCardProps {
  icon: React.ElementType
  value: string
  label: string
  color: 'blue' | 'emerald' | 'yellow'
}

function StatCard({ icon: Icon, value, label, color }: StatCardProps) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 text-yellow-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 text-center border border-white/5`}>
      <Icon className="w-5 h-5 mx-auto mb-2 opacity-80" />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  )
}
