'use client'

import { motion } from 'framer-motion'
import { Power, Zap } from 'lucide-react'
import { useDriverStore } from '@/stores/driverStore'
import { cn } from '@/lib/utils'

export function OnlineToggle() {
  const { isOnline, setIsOnline } = useDriverStore()

  return (
    <motion.button
      onClick={() => setIsOnline(!isOnline)}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative w-full rounded-3xl overflow-hidden transition-all duration-500",
        isOnline 
          ? "bg-gradient-to-br from-red-600 to-red-700 shadow-xl shadow-red-600/30" 
          : "bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl shadow-green-500/30"
      )}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0">
        {isOnline ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-500/30 rounded-full blur-3xl"
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-400/30 rounded-full blur-3xl"
            />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative h-24 flex items-center justify-center gap-4">
        <motion.div
          animate={{ 
            rotate: isOnline ? 0 : 0,
            scale: isOnline ? [1, 1.1, 1] : 1
          }}
          transition={{ duration: 0.5 }}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-colors duration-300",
            isOnline 
              ? "bg-white/20 shadow-inner" 
              : "bg-white/20 shadow-lg"
          )}
        >
          {isOnline ? (
            <Power className="w-7 h-7 text-white" />
          ) : (
            <Zap className="w-7 h-7 text-white" />
          )}
        </motion.div>
        
        <div className="text-left">
          <motion.span 
            key={isOnline ? 'offline' : 'online'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="block text-2xl font-bold text-white"
          >
            {isOnline ? 'HORS LIGNE' : 'GO ONLINE'}
          </motion.span>
          <span className="text-sm text-white/70">
            {isOnline ? 'Terminer la session' : 'Commencer à recevoir des courses'}
          </span>
        </div>
      </div>

      {/* Pulse ring when online */}
      {isOnline && (
        <div className="absolute top-4 right-4">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}
    </motion.button>
  )
}
