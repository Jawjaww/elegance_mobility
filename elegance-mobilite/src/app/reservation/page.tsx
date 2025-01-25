"use client"
import { motion } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import { useRatesStore } from "../../lib/ratesStore"
import { ReservationData } from "../../lib/types"
import { Button } from "../../components/ui/button"
import { Label } from "../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Switch } from "../../components/ui/switch"
import { AutocompleteInput } from "../../components/AutocompleteInput"
import MapComponent from "../../components/MapComponent"
import { useToast } from "../../components/ui/toast"

export default function Reservation() {
  const { toast } = useToast()
  
  const formatDistance = useCallback((distanceInMeters: number) => {
    const km = distanceInMeters / 1000
    return new Intl.NumberFormat('fr-FR', {
      style: 'unit',
      unit: 'kilometer',
      unitDisplay: 'short',
      maximumFractionDigits: 1
    }).format(km)
  }, [])

  const formatDuration = useCallback((durationInSeconds: number) => {
    const hours = Math.floor(durationInSeconds / 3600)
    const minutes = Math.floor((durationInSeconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }, [])
  const [step, setStep] = useState(1)
  const [origin, setOrigin] = useState<google.maps.LatLngLiteral | undefined>()
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | undefined>()
  const [originAddress, setOriginAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [distance, setDistance] = useState<number>()
  const [duration, setDuration] = useState<number>()
  const { initialize } = useRatesStore()
  const [pickupDateTime, setPickupDateTime] = useState<Date>(new Date())
  const [vehicleType, setVehicleType] = useState<'STANDARD' | 'PREMIUM' | 'VIP'>('PREMIUM')
  const [options, setOptions] = useState<ReservationData['options']>({
    luggage: false,
    childSeat: false,
    petFriendly: false
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleNextStep = useCallback(() => {
    if (!origin || !destination || !originAddress || !destinationAddress) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une adresse de départ et une destination valides',
        variant: 'destructive'
      })
      return
    }
    
    if (typeof originAddress !== 'string' || typeof destinationAddress !== 'string') {
      toast({
        title: 'Erreur',
        description: 'Format d\'adresse invalide',
        variant: 'destructive'
      })
      return
    }
    
    setStep(prev => Math.min(prev + 1, 2))
  }, [origin, destination, originAddress, destinationAddress, toast])

  const handleReservation = useCallback(() => {
    if (!origin || !destination) return

    const reservationData = {
      origin: originAddress,
      destination: destinationAddress,
      pickupDateTime,
      vehicleType,
      options,
      distance,
      duration
    }

    localStorage.setItem('reservationData', JSON.stringify({
      ...reservationData,
      pickupDateTime: pickupDateTime.toISOString()
    }))
    
    window.location.href = '/reservation/confirmation'
  }, [origin, destination, originAddress, destinationAddress, pickupDateTime, vehicleType, options, distance, duration])

  const handlePrevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1))
  }, [])

  const handleOriginSelect = useCallback(async (place: google.maps.places.PlaceResult) => {
    if (!place.formatted_address) return;
    
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({ address: place.formatted_address });
    
    if (response.results?.[0]?.geometry?.location) {
      setOrigin({
        lat: response.results[0].geometry.location.lat(),
        lng: response.results[0].geometry.location.lng()
      });
      setOriginAddress(place.formatted_address);
    }
  }, []);

  const handleDestinationSelect = useCallback((place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      setDestination({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      })
      setDestinationAddress(place.formatted_address || '')
    }
  }, [])

  const handleOriginChange = useCallback((value: string) => {
    setOriginAddress(value)
    if (!value) {
      setOrigin(undefined)
    }
  }, [])

  const handleDestinationChange = useCallback((value: string) => {
    setDestinationAddress(value)
    if (!value) {
      setDestination(undefined)
    }
  }, [])

  return (
    <main className="relative min-h-screen bg-neutral-950 overflow-hidden">
      <div className="absolute inset-0 perspective-1000">
        <div className="relative h-full w-full transform-style-3d">
          <div className="absolute inset-0 bg-[url('/car-bg.jpg')] bg-cover bg-center transform translate-z-[-100px] scale-1.2" />
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-3xl transform translate-z-[-50px]" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8">
        <motion.div
          className="w-full max-w-2xl bg-neutral-900/50 backdrop-blur-lg rounded-lg border border-neutral-800 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-neutral-100 mb-8">Planifiez votre trajet</h1>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="start" className="text-neutral-300">Point de départ</Label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                      <AutocompleteInput
                        id="start"
                        type="pickup"
                        placeholder="Adresse de départ"
                        value={originAddress}
                        onChange={handleOriginChange}
                        onPlaceSelected={handleOriginSelect}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        navigator.geolocation.getCurrentPosition((position) => {
                          setOrigin({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                          })
                          setOriginAddress('Position actuelle')
                        })
                      }}
                      className="bg-blue-600 hover:bg-blue-700 p-2 flex items-center justify-center md:w-auto w-full"
                      title="Utiliser ma position actuelle"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="10" cy="10" r="7"/>
                        <line x1="10" y1="3" x2="10" y2="7"/>
                        <line x1="10" y1="13" x2="10" y2="17"/>
                        <line x1="3" y1="10" x2="7" y2="10"/>
                        <line x1="13" y1="10" x2="17" y2="10"/>
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">Date et heure de prise en charge</Label>
                  <div className="relative cursor-pointer">
                    <input
                      type="datetime-local"
                      value={pickupDateTime.toISOString().slice(0, 16)}
                      onChange={(e) => setPickupDateTime(new Date(e.target.value))}
                      className="w-full p-2 rounded-md bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:ring-blue-500 cursor-pointer appearance-none"
                      min={new Date().toISOString().slice(0, 16)}
                      onKeyDown={(e) => e.preventDefault()}
                      aria-label="Sélectionnez la date et l'heure de prise en charge"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination" className="text-neutral-300">Destination</Label>
                  <AutocompleteInput
                    id="destination"
                    type="dropoff"
                    placeholder="Adresse de destination"
                    value={destinationAddress}
                    onChange={handleDestinationChange}
                    onPlaceSelected={handleDestinationSelect}
                  />
                </div>

                <div className="mt-6 h-64 rounded-lg overflow-hidden">
                  <MapComponent
                    markers={[
                      ...(origin ? [{
                        position: origin,
                        address: originAddress,
                        label: 'Départ'
                      }] : []),
                      ...(destination ? [{
                        position: destination,
                        address: destinationAddress,
                        label: 'Arrivée'
                      }] : [])
                    ]}
                    zoom={12}
                    onRouteCalculated={(distance, duration) => {
                      setDistance(parseFloat(distance.replace(' km', '')) * 1000)
                      setDuration(parseInt(duration.replace('min', '').replace('h ', '')) * 60)
                    }}
                  />
                </div>

                <Button
                  onClick={handleNextStep}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700"
                  disabled={!origin || !destination}
                >
                  Suivant
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-neutral-100 mb-8">Personnalisez votre trajet</h1>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-neutral-300">Type de véhicule</Label>
                  <RadioGroup
                    value={vehicleType}
                    onValueChange={(value: string) => {
                      if (['STANDARD', 'PREMIUM', 'VIP'].includes(value)) {
                        setVehicleType(value as typeof vehicleType)
                      }
                    }}
                    className="grid grid-cols-3 gap-4"
                  >
                    <RadioGroupItem
                      value="STANDARD"
                      id="standard"
                      className="peer hidden"
                    />
                    <Label
                      htmlFor="standard"
                      className={`p-1 rounded-lg cursor-pointer transition-all ${
                        vehicleType === 'STANDARD'
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-neutral-800/50 hover:bg-neutral-800/70'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-between p-4">
                        <span className="text-sm font-medium">Standard</span>
                      </div>
                    </Label>

                    <RadioGroupItem
                      value="PREMIUM"
                      id="premium"
                      className="peer hidden"
                    />
                    <Label
                      htmlFor="premium"
                      className={`p-1 rounded-lg cursor-pointer transition-all ${
                        vehicleType === 'PREMIUM'
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-neutral-800/50 hover:bg-neutral-800/70'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-between p-4">
                        <span className="text-sm font-medium">Premium</span>
                      </div>
                    </Label>

                    <RadioGroupItem
                      value="VIP"
                      id="vip"
                      className="peer hidden"
                    />
                    <Label
                      htmlFor="vip"
                      className={`p-1 rounded-lg cursor-pointer transition-all ${
                        vehicleType === 'VIP'
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-neutral-800/50 hover:bg-neutral-800/70'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-between p-4">
                        <span className="text-sm font-medium">VIP</span>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-neutral-300">Options supplémentaires</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50">
                      <Label htmlFor="luggage" className="text-sm">Bagages</Label>
                      <Switch
                        id="luggage"
                        checked={options.luggage}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, luggage: checked }))}
                        className="data-[state=unchecked]:translate-x-0 justify-start"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50">
                      <Label htmlFor="childSeat" className="text-sm">Siège enfant</Label>
                      <Switch
                        id="childSeat"
                        checked={options.childSeat}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, childSeat: checked }))}
                        className="data-[state=unchecked]:translate-x-0 justify-start"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50">
                      <Label htmlFor="petFriendly" className="text-sm">Animaux acceptés</Label>
                      <Switch
                        id="petFriendly"
                        checked={options.petFriendly}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, petFriendly: checked }))}
                        className="data-[state=unchecked]:translate-x-0 justify-start"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg bg-neutral-800/50">
                  <div className="space-y-3">
                    {distance && (
                      <div className="flex justify-between text-sm text-neutral-300">
                        <span>Distance</span>
                        <span>{formatDistance(distance)}</span>
                      </div>
                    )}
                    {duration && (
                      <div className="flex justify-between text-sm text-neutral-300">
                        <span>Durée estimée</span>
                        <span>{formatDuration(duration)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleReservation}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700"
                  >
                    Réserver
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
