'use client'

import { motion } from 'framer-motion'
import { Power } from 'lucide-react'
import { useDriverStore } from '@/stores/driverStore'

export function OnlineToggle() {
  const { isOnline, setIsOnline } = useDriverStore()

  return (
    <motion.button
      onClick={() => setIsOnline(!isOnline)}
      whileTap={{ scale: 0.98 }}
      className={`w-full h-16 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors ${
        isOnline 
          ? 'bg-red-500 text-white' 
          : 'bg-green-600 text-white'
      }`}
    >
      <Power className="w-6 h-6" />
      {isOnline ? 'HORS LIGNE' : 'GO ONLINE'}
    </motion.button>
  )
}
