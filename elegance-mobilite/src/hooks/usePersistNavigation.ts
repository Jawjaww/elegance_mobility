import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function usePersistNavigation() {
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState<string>('')

  useEffect(() => {
    if (!pathname) return

    // Si c'est juste un changement de paramètres dans la même section
    // (ex: /backoffice-portal/rides/123 -> /backoffice-portal/rides/456)
    // on ne réinitialise pas l'animation
    const currentSection = pathname.split('/').slice(0, 3).join('/')
    const prevSection = prevPathname.split('/').slice(0, 3).join('/')

    if (currentSection !== prevSection) {
      setPrevPathname(pathname)
    }
  }, [pathname, prevPathname])

  const isWithinSameSection = (path: string): boolean => {
    if (!pathname) return false
    
    const currentSection = pathname.split('/').slice(0, 3).join('/')
    const itemSection = path.split('/').slice(0, 3).join('/')
    return currentSection === itemSection
  }

  return {
    isWithinSameSection
  }
}