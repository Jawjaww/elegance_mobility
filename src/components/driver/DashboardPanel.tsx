'use client'

import { useDriverStore } from '@/lib/driver/store'
import { Stats } from './Stats'
import { OnlineToggle } from './OnlineToggle'

export function DashboardPanel() {
  const { isOnline } = useDriverStore()

  return (
    <div className="fixed left-0 right-0 bottom-0 z-20 bg-neutral-950 rounded-t-[2rem] shadow-2xl border-t border-white/10">
      {/* Handle */}
      <div className="flex justify-center pt-4 pb-2">
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Stats */}
        <Stats />

        {/* Online toggle */}
        <OnlineToggle />

        {/* Info text */}
        {!isOnline && (
          <p className="text-center text-sm text-neutral-500">
            Passez en ligne pour recevoir des courses
          </p>
        )}
      </div>
    </div>
  )
}
