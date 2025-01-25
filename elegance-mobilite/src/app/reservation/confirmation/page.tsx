"use client"

import { useCalculatePrice } from "../../../lib/rates"
import { Button } from "../../../components/ui/button"
import { useRouter } from "next/navigation"
import MapComponent from "@/components/MapComponent"
import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAddressStore } from "../../../lib/addressStore"

interface Coordinates {
  lat: number
  lng: number
}

interface ReservationData {
  origin: string
  destination: string
  pickupDateTime: Date
  vehicleType: 'STANDARD' | 'PREMIUM' | 'VIP'
  options: {
    luggage: boolean
    childSeat: boolean
    petFriendly: boolean
  }
  distance?: string
  duration?: string
  coords?: Coordinates
  destinationCoords?: Coordinates
}

export default function ConfirmationPage() {
  const router = useRouter()
  const { calculatePrice } = useCalculatePrice()
  const { pickup, dropoff } = useAddressStore()
  const [reservationData, setReservationData] = useState<ReservationData | null>(null)
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const stableCalculatePrice = useCallback(calculatePrice, [])

  useEffect(() => {
    let isMounted = true
    
    const fetchDataAndCalculate = async () => {
      const data = localStorage.getItem('reservationData')
      if (!data) {
        router.push('/reservation')
        return
      }

      const parsedData = JSON.parse(data)
      parsedData.pickupDateTime = new Date(parsedData.pickupDateTime)
      
      // Convertir la distance et durée
      const distanceKm = parsedData.distance ?
        typeof parsedData.distance === 'string' ?
          parseFloat(parsedData.distance.split(' ')[0]) :
          parsedData.distance :
        0

      const durationMinutes = parsedData.duration ?
        typeof parsedData.duration === 'string' ?
          parseFloat(parsedData.duration.split(' ')[0]) :
          parsedData.duration :
        0

      try {
        const price = await stableCalculatePrice(
          distanceKm,
          durationMinutes,
          parsedData.vehicleType,
          parsedData.pickupDateTime,
          parsedData.origin,
          parsedData.destination
        )
        
        if (isMounted) {
          setReservationData(parsedData as ReservationData)
          setPrice(price)
        }
      } catch (error) {
        console.error('Erreur lors du calcul du prix:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDataAndCalculate()

    return () => {
      isMounted = false
    }
  }, [stableCalculatePrice, router])

  if (!reservationData || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement des informations de réservation...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-8">Confirmez votre réservation</h1>
      </motion.div>

      <div className="space-y-8">
        {/* Indicateur de progression */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                1
              </div>
              <div className="ml-2 text-sm font-medium">Réservation</div>
            </div>
            <div className="w-16 h-0.5 bg-neutral-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center text-neutral-500">
                2
              </div>
              <div className="ml-2 text-sm font-medium text-neutral-500">Confirmation</div>
            </div>
          </div>
        </div>

        {/* Loader pendant le calcul du prix */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        {/* Cartes des adresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="relative h-64 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => router.push('/reservation')}
          >
            <div className="h-full">
              <MapComponent
                markers={[
                  {
                    position: pickup.validated?.location || { lat: 48.709, lng: 2.454 },
                    label: 'Départ'
                  },
                  {
                    position: dropoff.validated?.location || { lat: 48.709, lng: 2.454 },
                    label: 'Arrivée'
                  }
                ]}
                zoom={12}
                onRouteCalculated={(distance, duration) => {
                  setReservationData(prev => {
                    if (!prev) return null
                    return {
                      ...prev,
                      distance: distance?.toString(),
                      duration: duration?.toString()
                    }
                  })
                }}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <h2 className="font-semibold text-white">Départ</h2>
              <p className="text-sm text-neutral-300">
                {pickup.raw || reservationData.origin}
              </p>
            </div>
          </div>

          <div
            className="relative h-64 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => router.push('/reservation')}
          >
            {dropoff.validated?.location && (
              <div className="h-full">
                <MapComponent
                  markers={[
                    {
                      position: dropoff.validated?.location || { lat: 48.709, lng: 2.454 },
                      label: 'Arrivée'
                    }
                  ]}
                  zoom={12}
                />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <h2 className="font-semibold text-white">Arrivée</h2>
              <p className="text-sm text-neutral-300">{reservationData.destination}</p>
            </div>
          </div>
        </div>

        {/* Flèche directionnelle */}
        <div className="flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-400"
          >
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </div>

        {/* Détails de la réservation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Date et heure</h2>
              <p>{new Date(reservationData.pickupDateTime).toLocaleString()}</p>
            </div>

            <div>
              <h2 className="font-semibold">Véhicule</h2>
              <p className="capitalize">{reservationData.vehicleType.toLowerCase()}</p>
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Options</h2>
            <ul className="space-y-2">
              {reservationData.options.luggage && <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2"/>
                </svg>
                Bagages
              </li>}
              {reservationData.options.childSeat && <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Siège enfant
              </li>}
              {reservationData.options.petFriendly && <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 16s1.5 2 4 2 4-2 4-2"/>
                  <path d="M3 22h18M3 2h18"/>
                  <path d="M7 22V2m10 20V2"/>
                </svg>
                Animaux acceptés
              </li>}
            </ul>
          </div>
        </motion.div>

        {/* Prix et boutons */}
        <div className="space-y-6">
          {price !== null && (
            <div className="bg-neutral-800 p-6 rounded-lg">
              <h2 className="font-semibold text-lg">Total</h2>
              <p className="text-2xl font-bold">{price.toFixed(2)}€</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/reservation')}
              className="flex-1"
            >
              Modifier
            </Button>
            <Button
              onClick={() => {
                // TODO: Implémenter la confirmation de réservation
              }}
              className="flex-1"
            >
              Confirmer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}