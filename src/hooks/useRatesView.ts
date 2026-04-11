import { useState, useCallback } from 'react'

export type RatesView = 'grid' | 'table'

interface UseRatesViewReturn {
  view: RatesView
  setView: (view: RatesView) => void
  toggleView: () => void
}

export function useRatesView(defaultView: RatesView = 'grid'): UseRatesViewReturn {
  const [view, setView] = useState<RatesView>(defaultView)

  const toggleView = useCallback(() => {
    setView((current) => (current === 'grid' ? 'table' : 'grid'))
  }, [])

  return {
    view,
    setView,
    toggleView,
  }
}