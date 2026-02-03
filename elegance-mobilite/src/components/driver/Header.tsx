'use client'

import { DollarSign } from 'lucide-react'
import { useDriverStore } from '@/lib/driver/store'
import { MobileNav } from './MobileNav'
import { motion } from 'framer-motion'

export function Header() {
  const { isOnline, stats } = useDriverStore()

  return (
    <>
      {/* Navigation mobile */}
      <MobileNav />

      {/* Header flottant */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-4 left-20 right-4 flex items-center justify-end gap-2 z-10"
      >
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
      </motion.div>
    </>
  )
}
