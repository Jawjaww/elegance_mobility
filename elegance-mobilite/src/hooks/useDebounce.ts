import { useEffect, useState } from 'react'

export const useDebounce = (delay = 300) => {
  const [debouncedFn, setDebouncedFn] = useState<() => void>()

  useEffect(() => {
    if (debouncedFn) {
      const timer = setTimeout(debouncedFn, delay)
      return () => clearTimeout(timer)
    }
  }, [debouncedFn, delay])

  return (fn: () => void) => setDebouncedFn(() => fn)
}