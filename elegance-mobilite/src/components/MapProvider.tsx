"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

type MapContextType = {
  isLoaded: boolean
  loader: Loader | null
}

const MapContext = createContext<MapContextType>({
  isLoaded: false,
  loader: null
})

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loader, setLoader] = useState<Loader | null>(null)

  useEffect(() => {
    let mounted = true
    
    const initMap = async () => {
      try {
        const loaderInstance = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          libraries: ['places', 'routes'],
          version: 'weekly',
          retries: 3
        })

        await loaderInstance.load()
        
        if (mounted) {
          setLoader(loaderInstance)
          setIsLoaded(true)
        }
      } catch (error) {
        console.error('Failed to load Google Maps API', error)
        if (mounted) {
          setIsLoaded(false)
        }
      }
    }

    initMap()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <MapContext.Provider value={{ isLoaded, loader }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  return useContext(MapContext)
}