"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "./ui/input"
import { useMap } from "./MapProvider"

interface AutocompleteInputProps {
  id: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void
}

export function AutocompleteInput({
  id,
  placeholder,
  value,
  onChange,
  onPlaceSelected
}: AutocompleteInputProps) {
  const { isLoaded, loader } = useMap()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    let autocomplete: google.maps.places.Autocomplete | null = null
    
    try {
      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'fr' },
        fields: ['formatted_address', 'geometry']
      })

      const placeChangedListener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete?.getPlace()
        if (place?.formatted_address) {
          onChange(place.formatted_address)
          onPlaceSelected(place)
        }
      })

      return () => {
        if (autocomplete) {
          google.maps.event.removeListener(placeChangedListener)
        }
      }
    } catch (error) {
      console.error('Failed to initialize autocomplete:', error)
    }
  }, [isLoaded, onChange, onPlaceSelected])

  if (!isLoaded) {
    return (
      <div className="relative">
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          disabled
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-400"></div>
          <span className="ml-2 text-sm text-neutral-400">Chargement...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        id={id}
        ref={inputRef}
        placeholder={placeholder}
        defaultValue={value}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
      />
    </div>
  )
}