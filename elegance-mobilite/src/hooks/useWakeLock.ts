/**
 * Hook useWakeLock
 * Empêche l'écran de s'éteindre pendant que le chauffeur travaille
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'

interface WakeLockSentinel {
  released: boolean
  release(): Promise<void>
}

declare global {
  interface Navigator {
    wakeLock?: {
      request(type: 'screen'): Promise<WakeLockSentinel>
    }
  }
}

export function useWakeLock(enabled: boolean) {
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) {
      console.log('[WakeLock] API not supported')
      return
    }

    try {
      wakeLock.current = await navigator.wakeLock!.request('screen')
      console.log('[WakeLock] Acquired')

      wakeLock.current.addEventListener('release', () => {
        console.log('[WakeLock] Released')
      })
    } catch (err) {
      console.error('[WakeLock] Failed to acquire:', err)
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock.current && !wakeLock.current.released) {
      await wakeLock.current.release()
      wakeLock.current = null
    }
  }, [])

  // Activer/désactiver selon l'état
  useEffect(() => {
    if (enabled) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    return () => {
      releaseWakeLock()
    }
  }, [enabled, requestWakeLock, releaseWakeLock])

  // Réacquérir si l'utilisateur revient sur l'app
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, requestWakeLock])

  return { isLocked: !!wakeLock.current }
}
