/**
 * Zustand store for driver portal UI state ONLY
 * ❌ NO API calls or server data (use TanStack Query instead)
 * ✅ Only UI interactions: tabs, modals, map preview, preferences
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

export type DriverTab = 'stats' | 'available' | 'scheduled'

interface DriverLocation {
  lat: number
  lng: number
  timestamp: number
}

interface DriverUIState {
  // ==========================================
  // UI STATE ONLY - NO SERVER DATA
  // ==========================================

  // Active tab in the bottom sheet
  activeTab: DriverTab
  setActiveTab: (tab: DriverTab) => void

  // Bottom sheet state
  bottomSheetExpanded: boolean
  setBottomSheetExpanded: (expanded: boolean) => void

  // Selected ride for map preview (ID only, data comes from TanStack Query)
  selectedRidePreview: string | null
  setSelectedRidePreview: (rideId: string | null) => void

  // Map center control
  mapCenter: { lat: number; lng: number } | null
  setMapCenter: (center: { lat: number; lng: number } | null) => void

  // Driver online status (UI preference, persisted in localStorage)
  isOnline: boolean
  setIsOnline: (online: boolean) => void

  // Driver location (UI state for geolocation, not stored in DB)
  driverLocation: DriverLocation | null
  setDriverLocation: (location: DriverLocation | null) => void

  // UI helpers
  showProfileAlert: boolean
  setShowProfileAlert: (show: boolean) => void

  // Reset all UI state (logout/cleanup)
  resetUIState: () => void

  // Complex UI actions
  previewRide: (rideId: string, pickupLat: number, pickupLng: number) => void
  clearPreview: () => void
}

export const useDriverUIStore = create<DriverUIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        activeTab: 'stats',
        bottomSheetExpanded: false,
        selectedRidePreview: null,
        mapCenter: null,
        isOnline: false,
        driverLocation: null,
        showProfileAlert: true,

        // Simple setters
        setActiveTab: (tab) => set({ activeTab: tab }),
        setBottomSheetExpanded: (expanded) => set({ bottomSheetExpanded: expanded }),
        setSelectedRidePreview: (rideId) => set({ selectedRidePreview: rideId }),
        setMapCenter: (center) => set({ mapCenter: center }),
        setIsOnline: (online) => set({ isOnline: online }),
        setDriverLocation: (location) => set({ driverLocation: location }),
        setShowProfileAlert: (show) => set({ showProfileAlert: show }),

        // Complex actions
        previewRide: (rideId, pickupLat, pickupLng) => set({
          selectedRidePreview: rideId,
          mapCenter: { lat: pickupLat, lng: pickupLng },
          bottomSheetExpanded: false, // Collapse to see map better
        }),

        clearPreview: () => set({
          selectedRidePreview: null,
          mapCenter: null,
        }),

        resetUIState: () => set({
          activeTab: 'stats',
          bottomSheetExpanded: false,
          selectedRidePreview: null,
          mapCenter: null,
          showProfileAlert: true,
          // Keep isOnline and driverLocation (user preferences)
        }),
      }),
      {
        name: 'driver-ui-state',
        // Only persist user preferences, not temporary UI state
        partialize: (state) => ({
          isOnline: state.isOnline,
          activeTab: state.activeTab,
          showProfileAlert: state.showProfileAlert,
        }),
      }
    ),
    {
      name: 'driver-ui-store',
    }
  )
)

// ==========================================
// IMPORTANT NOTES:
// ==========================================
// 
// ❌ NO API CALLS in this store
// ❌ NO server data (rides, driver profile, stats)
// ❌ NO Supabase subscriptions
// 
// ✅ Use TanStack Query hooks for all server data:
//    - useAvailableRides(driverId)
//    - useScheduledRides(driverId)
//    - useDriverProfile(driverId)
//    - useDriverStats(driverId, period)
//
// ✅ Use useRealtime hook for Supabase sync
// ✅ This store is ONLY for UI interactions
// ==========================================
