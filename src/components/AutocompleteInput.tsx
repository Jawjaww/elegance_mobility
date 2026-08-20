"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useDebounce } from "../hooks/useDebounce";
import { useToast } from "../hooks/useToast";
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

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Accès refusé. Autorisez la géolocalisation pour ce site dans les paramètres du navigateur.";
    case error.POSITION_UNAVAILABLE:
      return "Position indisponible. Vérifiez le GPS/Wi‑Fi ou désactivez les extensions (VPN, bloqueurs) qui interceptent la localisation.";
    case error.TIMEOUT:
      return "Délai dépassé. Réessayez dans un endroit avec un meilleur signal.";
    default:
      return "Impossible d'obtenir votre position actuelle. Saisissez l'adresse manuellement.";
  }
}

function getCurrentPosition(
  options?: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function AutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  onSelect,
  className,
  defaultValue
}: Readonly<AutocompleteInputProps>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string>(value || defaultValue || "");
  const debouncedQuery = useDebounce<string>(query, 300);
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const ignoreNextQueryChange = useRef(false);
  const { toast } = useToast();

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
    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation indisponible",
        description: "Votre navigateur ne prend pas en charge la géolocalisation.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      });

      const { latitude, longitude } = position.coords;
      const lat = latitude;
      const lon = longitude;

      const address = await reverseGeocode(lat, lon);
      if (!address) {
        toast({
          title: "Adresse introuvable",
          description:
            "Position obtenue, mais aucune adresse n'a pu être déterminée.",
          variant: "destructive",
        });
        return;
      }

      onSelect?.(lat, lon, address);
      setQuery(address);
      onChange?.(address);
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      toast({
        title: "Géolocalisation impossible",
        description: getGeolocationErrorMessage(geoError),
        variant: "destructive",
      });
      console.warn("[AutocompleteInput] geolocation failed", {
        code: geoError.code,
        message: geoError.message,
      });
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

    if (newValue === '') {
      setSuggestions([]);
      // Do not call onSelect with 0,0 (which maps to the Gulf of Guinea).
      // Let callers treat empty string as a reset via onChange and other UI logic.
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
          <ul className={styles.suggestions} role="listbox">
            {suggestions.map((feature) => {
              const label = feature.properties.label;
              const [lon, lat] = feature.geometry.coordinates;
              return (
                <li key={`${label}-${lon}-${lat}`} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className={styles.suggestion}
                    onClick={() => {
                      onSelect?.(lat, lon, label);
                      ignoreNextQueryChange.current = true;
                      setQuery(label);
                      setSuggestions([]);
                    }}
                  >
                    {formatAddress(feature)}
                  </button>
                </li>
              );
            })}
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
