/**
 * DevTools configuration for Zustand stores
 * Automatically enables Redux DevTools in development
 */

import { devtools, subscribeWithSelector } from 'zustand/middleware'

// Enable Redux DevTools for Zustand stores in development
export const withDevtools = <T>(
  config: any,
  options: { name: string; enabled?: boolean } = { name: 'store' }
) => {
  if (typeof window === 'undefined') {
    return config // No devtools on server
  }

  const { name, enabled = process.env.NODE_ENV === 'development' } = options

  if (!enabled) {
    return config
  }

  // Use devtools middleware for Redux DevTools integration
  return devtools(
    subscribeWithSelector(config),
    { name }
  )
}

// Export for convenience
export { devtools, subscribeWithSelector }
