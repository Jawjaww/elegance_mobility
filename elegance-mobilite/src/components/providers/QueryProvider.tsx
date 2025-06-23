'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Configuration optimisée pour le portail driver
        staleTime: 30 * 1000, // 30 secondes par défaut
        gcTime: 5 * 60 * 1000, // 5 minutes (anciennement cacheTime)
        refetchOnWindowFocus: false, // Éviter les refetch trop fréquents
        refetchOnReconnect: true, // Important pour la résilience réseau
        retry: (failureCount, error: any) => {
          // Ne pas retry les erreurs 4xx (problèmes d'auth, permissions)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry max 3 fois pour les autres erreurs
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
      },
      mutations: {
        retry: 1, // Une seule retry pour les mutations
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}
