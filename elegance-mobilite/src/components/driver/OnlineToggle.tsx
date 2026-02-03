'use client'

import { motion } from 'framer-motion'
import { Power } from 'lucide-react'
import { useDriverStore } from '@/lib/driver/store'

export function OnlineToggle() {
  const { isOnline, setIsOnline } = useDriverStore()

  return (
    <motion.button
      onClick={() => setIsOnline(!isOnline)}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      className={`w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
        isOnline 
          ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25' 
          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
      }`}
    >
      <Power className="w-6 h-6" />
      {isOnline ? 'PASSER HORS LIGNE' : 'GO ONLINE'}
    </motion.button>
  )
}
