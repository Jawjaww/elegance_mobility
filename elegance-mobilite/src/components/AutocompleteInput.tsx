"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useDebounce } from "../hooks/useDebounce";
import type { Coordinates } from "@/lib/types";
import styles from "./AutocompleteInput.module.css";

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0];
    }
    return null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};

interface AutocompleteInputProps {
  id: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onSelect?: (address: string, position: Coordinates) => void;
  className?: string;
  defaultValue?: string;
}

interface AddressFeature {
  properties: {
    label: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

function formatAddress(feature: AddressFeature): string {
  const { label } = feature.properties;
  const parts = label.split(',');
  if (parts.length >= 2) {
    const addressPart = parts[0].trim();
    const cityPart = parts[1].trim();
    return `${addressPart} - ${cityPart}`;
  }
  return label;
}

export function AutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  onSelect,
  className,
  defaultValue
}: AutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value || defaultValue || "");
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const ignoreNextQueryChange = useRef(false);

  useEffect(() => {
    if (ignoreNextQueryChange.current || !hasUserInteracted) {
      ignoreNextQueryChange.current = false;
      return;
    }

    const cleanQuery = debouncedQuery.trim().replace(/[^\w\s]/g, '');
    if (cleanQuery.length > 2) {
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cleanQuery)}&limit=5&autocomplete=1`)
        .then((res) => res.json())
        .then((data) => {
          if (data.features) {
            setSuggestions(data.features);
          }
        })
        .catch((error) => {
          console.error("Error fetching geocoding data:", error);
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, hasUserInteracted]);

  const handleGeolocation = async () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      console.error("La géolocalisation n'est pas supportée");
      setIsLocating(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      const feature = await reverseGeocode(latitude, longitude);
      
      if (feature && onSelect) {
        const coords = {
          lat: latitude,
          lng: longitude,
        };
        onSelect(feature.properties.label, coords);
        ignoreNextQueryChange.current = true;
        setQuery(feature.properties.label);
        setSuggestions([]); // Clear suggestions after selecting geolocation
      }
    } catch (error) {
      console.error("Erreur de géolocalisation:", error);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (defaultValue) {
      setQuery(defaultValue);
    }
  }, [defaultValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    ignoreNextQueryChange.current = false;
    setHasUserInteracted(true);
    setQuery(newValue);
    onChange?.(newValue);

    if (newValue === '' && onSelect) {
      onSelect('', { lat: 0, lng: 0 });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <Input
          id={id}
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          ref={inputRef}
          className={className}
        />
        {suggestions.length > 0 && (
          <ul className={styles.suggestions}>
            {suggestions.map((feature, idx) => (
              <li
                key={idx}
                className={styles.suggestion}
                onClick={() => {
                  const position = {
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0],
                  };
                  onSelect?.(feature.properties.label, position);
                  ignoreNextQueryChange.current = true;
                  setQuery(feature.properties.label);
                  setSuggestions([]);
                }}
              >
                {formatAddress(feature)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        type="button"
        onClick={handleGeolocation}
        className={styles.locationButton}
        disabled={isLocating}
        title="Utiliser ma position actuelle"
      >
        {isLocating ? (
          "⌛"
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className={styles.locationIcon}
          >
            <path 
              fillRule="evenodd" 
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" 
              clipRule="evenodd"
            />
          </svg>
        )}
      </Button>
    </div>
  );
}
