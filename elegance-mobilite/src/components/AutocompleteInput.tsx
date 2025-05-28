"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useDebounce } from "../hooks/useDebounce";
import styles from "./AutocompleteInput.module.css";

// Définir le type Coordinates localement en utilisant lon
interface Coordinates {
  lat: number;
  lon: number; // Standardisé sur lon
}

const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].properties.label;
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
  onSelect?: (lat: number, lon: number, address: string) => void; // Mise à jour pour utiliser lon
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
  const [query, setQuery] = useState<string>(value || defaultValue || "");
  const debouncedQuery = useDebounce<string>(query, 300);
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const ignoreNextQueryChange = useRef(false);

  useEffect(() => {
    if (ignoreNextQueryChange.current || !hasUserInteracted) {
      ignoreNextQueryChange.current = false;
      return;
    }

    const cleanQuery = String(debouncedQuery || "").trim().replace(/[^\w\s]/g, '');
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
    if (navigator.geolocation) {
      setIsLocating(true);
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // S'assurer que les deux coordonnées sont présentes et valides
            if (latitude === undefined || latitude === null || 
                longitude === undefined || longitude === null) {
              console.error("Coordonnées de géolocalisation invalides");
              setIsLocating(false);
              return;
            }
            
            // Conversion explicite en numbers pour éviter des problèmes de types
            const lat = parseFloat(latitude.toString());
            const lon = parseFloat(longitude.toString()); 
            
            // Utilisez ces coordonnées pour obtenir l'adresse
            try {
              const address = await reverseGeocode(lat, lon);
              
              // Mise à jour de l'entrée et déclenchement du gestionnaire onSelect
              if (onSelect && address) {
                // Passer les coordonnées dans le format standardisé
                onSelect(lat, lon, address);
              }
              
              // Mettre à jour l'entrée avec l'adresse
              if (address) {
                setQuery(address);
                onChange?.(address);
              }
              
              setIsLocating(false);
            } catch (error) {
              console.error("Erreur lors du géocodage inversé:", error);
              setIsLocating(false);
            }
          },
          (error) => {
            console.error("Erreur de géolocalisation:", error);
            setIsLocating(false);
          }
        );
      } catch (error) {
        console.error("Erreur lors de la géolocalisation:", error);
        setIsLocating(false);
      }
    } else {
      console.error("La géolocalisation n'est pas prise en charge par ce navigateur");
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

    if (newValue === '') {
      setSuggestions([]);
      // Passer des paramètres zéro explicites pour signaler une réinitialisation
      // plutôt que des valeurs invalides
      if (onSelect) {
        onSelect(0, 0, '');
      }
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
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              suggestions.length > 0
            ) {
              const feature = suggestions[0];
              const lat = feature.geometry.coordinates[1];
              const lon = feature.geometry.coordinates[0];
              onSelect?.(lat, lon, feature.properties.label);
              ignoreNextQueryChange.current = true;
              setQuery(feature.properties.label);
              setSuggestions([]);
              e.preventDefault();
            }
          }}
        />
        {suggestions.length > 0 && (
          <ul className={styles.suggestions}>
            {suggestions.map((feature, idx) => (
              <li
                key={idx}
                className={styles.suggestion}
                onClick={() => {
                  const lat = feature.geometry.coordinates[1];
                  const lon = feature.geometry.coordinates[0]; // Standardisé sur lon
                  onSelect?.(lat, lon, feature.properties.label);
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
