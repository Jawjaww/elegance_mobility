'use client'

import { motion } from 'framer-motion'
import { Power } from 'lucide-react'
import { useDriverStore } from '@/stores/driverStore'
import { cn } from '@/lib/utils'

export function OnlineToggle() {
  const { isOnline, setIsOnline } = useDriverStore()

  return (
    <motion.button
      onClick={() => setIsOnline(!isOnline)}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative w-full h-20 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3",
        isOnline 
          ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30" 
          : "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
      )}
    >
      {/* Pulse effect when online */}
      {isOnline && (
        <>
          <span className="absolute inset-0 rounded-2xl animate-ping bg-red-500/30" />
          <span className="absolute -inset-1 rounded-2xl animate-pulse bg-red-500/20" />
        </>
      )}
      
      <Power className={cn(
        "w-6 h-6 transition-transform",
        isOnline && "rotate-0"
      )} />
      
      <span className="relative z-10">
        {isOnline ? '🔴 HORS LIGNE' : '🟢 GO ONLINE'}
      </span>
    </motion.button>
  )
}
