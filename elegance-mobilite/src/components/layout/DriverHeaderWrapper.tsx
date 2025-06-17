'use client'

import { DriverHeader } from "./DriverHeader"
import { useDriver } from "@/contexts/DriverContext"
import type { User } from "@/lib/types/common.types"

interface DriverHeaderWrapperProps {
  user: User
}

export function DriverHeaderWrapper({ user }: DriverHeaderWrapperProps) {
  const { isOnline, todayStats, toggleOnlineStatus } = useDriver()

  return (
    <DriverHeader
      user={user}
      isOnline={isOnline}
      onToggleOnline={toggleOnlineStatus}
      todayEarnings={todayStats.earnings}
      todayRides={todayStats.rides}
      currentRating={todayStats.rating}
    />
  )
}
