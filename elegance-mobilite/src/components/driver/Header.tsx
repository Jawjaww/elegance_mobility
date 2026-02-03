'use client'

import { Menu, DollarSign } from 'lucide-react'
import { useDriverStore } from '@/lib/driver/store'

export function Header() {
  const { isOnline, stats } = useDriverStore()

  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
      {/* Menu button */}
      <button className="w-11 h-11 bg-neutral-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/10 hover:bg-neutral-800 transition-colors">
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Status indicator */}
      <div className="bg-neutral-900/90 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg border border-white/10">
        <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'}`} />
        <span className="text-sm font-medium text-white">
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>

      {/* Earnings */}
      <button className="bg-neutral-900/90 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg border border-white/10 hover:bg-neutral-800 transition-colors">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <span className="font-bold text-white">{stats.todayEarnings.toFixed(0)}€</span>
      </button>
    </div>
  )
}
