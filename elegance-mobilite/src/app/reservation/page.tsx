"use client"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useCalculatePrice } from "@/lib/rates"
import { Button } from "../../components/ui/button"
import { Label } from "../../components/ui/label"
import { RadioGroup } from "../../components/ui/radio-group"
import { Switch } from "../../components/ui/switch"
import { AutocompleteInput } from "../../components/AutocompleteInput"
import MapComponent from "../../components/MapComponent"

export default function Reservation() {
  const [step, setStep] = useState(1)
  const [origin, setOrigin] = useState<{
    coords?: google.maps.LatLngLiteral
    address?: string
  }>({})
  const [destination, setDestination] = useState<{
    coords?: google.maps.LatLngLiteral
    address?: string
  }>({})
  const [distance, setDistance] = useState<string>()
  const [duration, setDuration] = useState<string>()
  const [estimatedPrice, setEstimatedPrice] = useState<number>()
  const { calculatePrice } = useCalculatePrice()
  const [pickupDateTime, setPickupDateTime] = useState<Date>(new Date())
  const [vehicleType, setVehicleType] = useState<'STANDARD' | 'PREMIUM' | 'VIP'>('PREMIUM')
  const [options, setOptions] = useState<{
    luggage: boolean
    childSeat: boolean
    petFriendly: boolean
  }>({
    luggage: false,
    childSeat: false,
    petFriendly: false
  })
  // Price calculation using new pricing system
  useEffect(() => {
    if (distance) {
      const distanceValue = parseFloat(distance.replace(',', '.'))
      const durationValue = duration ? parseFloat(duration.replace(' min', '')) : 0
      
      // Get pricing based on vehicle type
      const isPremium = vehicleType === 'PREMIUM' || vehicleType === 'VIP'
      
      // Calculate base price using new pricing system
      const price = calculatePrice(
        distanceValue,
        durationValue,
        vehicleType,
        pickupDateTime,
        origin.address || '',
        destination.address || ''
      )
      
      // Add options price
      let finalPrice = price
      if (options.luggage) finalPrice += 5
      if (options.childSeat) finalPrice += 7  
      if (options.petFriendly) finalPrice += 5
      
      // Apply minimum price
      const minimumPrice = isPremium ? 25.50 : 24.50
      finalPrice = Math.max(finalPrice, minimumPrice)
      
      setEstimatedPrice(Number(finalPrice.toFixed(2)))
    }
  }, [distance, duration, vehicleType, options, pickupDateTime, calculatePrice, origin.address, destination.address])

  const handleNextStep = () => {
    setStep(prev => Math.min(prev + 1, 2))
  }

  const handlePrevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <main className="relative min-h-screen bg-neutral-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 perspective-1000">
        <div className="relative h-full w-full transform-style-3d">
          <div className="absolute inset-0 bg-[url('/car-bg.jpg')] bg-cover bg-center transform translate-z-[-100px] scale-1.2" />
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-3xl transform translate-z-[-50px]" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8">
        <motion.div
          className="w-full max-w-2xl bg-neutral-900/50 backdrop-blur-lg rounded-lg border border-neutral-800 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Step 1: Address and Map */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-neutral-100 mb-8">Planifiez votre trajet</h1>
              
              {/* Address inputs */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="start" className="text-neutral-300">Point de départ</Label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                      <AutocompleteInput
                        id="start"
                        placeholder="Adresse de départ"
                        value={origin.address || ''}
                        onChange={(value) => {
                          if (!value) {
                            setOrigin({})
                          }
                        }}
                        onPlaceSelected={(place) => {
                          if (place.geometry?.location) {
                            setOrigin({
                              coords: {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                              },
                              address: place.formatted_address || ''
                            })
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        navigator.geolocation.getCurrentPosition((position) => {
                          setOrigin({
                            coords: {
                              lat: position.coords.latitude,
                              lng: position.coords.longitude
                            },
                            address: 'Position actuelle'
                          })
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
                  <div
                    className="relative cursor-pointer"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      input?.showPicker();
                    }}
                  >
                    <input
                      type="datetime-local"
                      value={pickupDateTime.toISOString().slice(0, 16)}
                      onChange={(e) => setPickupDateTime(new Date(e.target.value))}
                      className="w-full p-2 rounded-md bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:ring-blue-500 cursor-pointer appearance-none"
                      min={new Date().toISOString().slice(0, 16)}
                      onKeyDown={(e) => e.preventDefault()}
                      aria-label="Sélectionnez la date et l'heure de prise en charge"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination" className="text-neutral-300">Destination</Label>
                  <AutocompleteInput
                    id="destination"
                    placeholder="Adresse de destination"
                    value={destination.address || ''}
                    onChange={(value) => {
                      if (!value) {
                        setDestination({})
                      }
                    }}
                    onPlaceSelected={(place) => {
                      if (place.geometry?.location) {
                        setDestination({
                          coords: {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                          },
                          address: place.formatted_address || ''
                        })
                      }
                    }}
                  />
                </div>

                {/* Map */}
                <div className="mt-6 h-64 rounded-lg overflow-hidden">
                  <MapComponent
                    origin={origin.coords}
                    destination={destination.coords}
                    onRouteCalculated={(distance, duration) => {
                      setDistance(distance)
                      setDuration(duration)
                    }}
                    onPlaceSelected={(place) => {
                      if (place.geometry?.location) {
                        const location = {
                          lat: place.geometry.location.lat(),
                          lng: place.geometry.location.lng()
                        }
                        
                        // Update address in corresponding input
                        const activeElement = document.activeElement
                        if (activeElement?.id === 'start') {
                          setOrigin({
                            coords: location,
                            address: place.formatted_address || ''
                          })
                          const input = document.getElementById('start') as HTMLInputElement
                          if (input) {
                            input.value = place.formatted_address || ''
                          }
                        } else if (activeElement?.id === 'destination') {
                          setDestination({
                            coords: {
                              lat: location.lat,
                              lng: location.lng
                            },
                            address: place.formatted_address || ''
                          })
                          const input = document.getElementById('destination') as HTMLInputElement
                          if (input) {
                            input.value = place.formatted_address || ''
                          }
                        }
                      }
                    }}
                  />
                </div>

                {/* Next button */}
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

          {/* Step 2: Options and Pricing */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-neutral-100 mb-8">Personnalisez votre trajet</h1>

              <div className="space-y-6">
                {/* Vehicle type */}
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
                    <div
                      className={`p-1 rounded-lg cursor-pointer transition-all ${
                        vehicleType === 'STANDARD'
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-neutral-800/50 hover:bg-neutral-800/70'
                      }`}
                      onClick={() => setVehicleType('STANDARD')}
                    >
                      <div className="flex flex-col items-center justify-between p-4">
                        <span className="text-sm font-medium">Standard</span>
                        <span className="text-xs text-neutral-400">À partir de 5€</span>
                      </div>
                    </div>
                    <div
                      className={`p-1 rounded-lg cursor-pointer transition-all ${
                        vehicleType === 'PREMIUM'
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-neutral-800/50 hover:bg-neutral-800/70'
                      }`}
                      onClick={() => setVehicleType('PREMIUM')}
                    >
                      <div className="flex flex-col items-center justify-between p-4">
                        <span className="text-sm font-medium">Premium</span>
                        <span className="text-xs text-neutral-400">À partir de 10€</span>
                      </div>
                    </div>
                    <div
                      className={`p-1 rounded-lg cursor-pointer transition-all ${
                        vehicleType === 'VIP'
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-neutral-800/50 hover:bg-neutral-800/70'
                      }`}
                      onClick={() => setVehicleType('VIP')}
                    >
                      <div className="flex flex-col items-center justify-between p-4">
                        <span className="text-sm font-medium">VIP</span>
                        <span className="text-xs text-neutral-400">À partir de 20€</span>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Additional options */}
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

                {/* Price summary */}
                <div className="p-6 rounded-lg bg-neutral-800/50">
                  <div className="space-y-3">
                    {distance && (
                      <div className="flex justify-between text-sm text-neutral-300">
                        <span>Distance</span>
                        <span>{distance}</span>
                      </div>
                    )}
                    {duration && (
                      <div className="flex justify-between text-sm text-neutral-300">
                        <span>Durée estimée</span>
                        <span>{duration}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-blue-400">
                      <span>Rate total</span>
                      <span>{estimatedPrice?.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
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
