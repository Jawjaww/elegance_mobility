'use client'

import { useDriverStore } from '@/lib/driver/store'
import { Wifi, WifiOff, Radio, AlertCircle } from 'lucide-react'

export function SubscriptionDebug() {
  const { isOnline, availableRide, activeRide } = useDriverStore()

  // Ne pas afficher en production
  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed top-20 left-4 z-50 bg-neutral-900/90 backdrop-blur border border-white/10 rounded-xl p-3 text-xs font-mono space-y-2 max-w-[200px]">
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-400">En ligne</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-400">Hors ligne</span>
          </>
        )}
      </div>
      
      {isOnline && (
        <>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-500" />
            <span className="text-blue-400">Subscription active</span>
          </div>
          
          <div className="border-t border-white/10 pt-2">
            <div className="text-neutral-500">Course disponible:</div>
            <div className={availableRide ? 'text-emerald-400' : 'text-neutral-600'}>
              {availableRide ? `🟢 ${availableRide.id.slice(0, 8)}...` : '⚪ Aucune'}
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-2">
            <div className="text-neutral-500">Course active:</div>
            <div className={activeRide ? 'text-amber-400' : 'text-neutral-600'}>
              {activeRide ? `🟡 ${activeRide.id.slice(0, 8)}...` : '⚪ Aucune'}
            </div>
          </div>
        </>
      )}
      
      {!isOnline && (
        <div className="flex items-start gap-2 text-amber-500/80">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Passez en ligne pour recevoir les courses</span>
        </div>
      )}
    </div>
  )
}
