"use client";

import { useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { useMap } from "./MapProvider";

interface AutocompleteInputProps {
  id: string;
  type: 'pickup' | 'dropoff';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
}

export function AutocompleteInput({
  id,
  type,
  placeholder,
  value,
  onChange,
  onPlaceSelected
}: AutocompleteInputProps) {
  const { isLoaded } = useMap();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete>();

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ['formatted_address', 'geometry', 'place_id'],
          types: ['address'],
          componentRestrictions: { country: 'fr' }
        }
      );

      const placeChangedListener = autocompleteRef.current.addListener(
        'place_changed',
        () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address);
            onPlaceSelected(place);
          }
        }
      );

      return () => {
        if (placeChangedListener) {
          google.maps.event.removeListener(placeChangedListener);
        }
      };
    } catch (error) {
      console.error('Erreur d\'initialisation de l\'autocomplete:', error);
    }
  }, [isLoaded, onChange, onPlaceSelected]);

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
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-400" />
          <span className="ml-2 text-sm text-neutral-400">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        id={id}
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        aria-label={type === 'pickup' 
          ? "Adresse de prise en charge" 
          : "Adresse de destination"}
      />
    </div>
  );
}
