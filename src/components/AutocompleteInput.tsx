"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { useDebounce } from "../hooks/useDebounce";
import { useToast } from "../hooks/useToast";
import { cn } from "@/lib/utils";
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
  const parts = label.split(",");
  if (parts.length >= 2) {
    const addressPart = parts[0].trim();
    const cityPart = parts[1].trim();
    return `${addressPart} - ${cityPart}`;
  }
  return label;
}

/** Numeric GeolocationPositionError codes (Chrome may omit named constants on the instance). */
const GEO_PERMISSION_DENIED = 1;
const GEO_POSITION_UNAVAILABLE = 2;
const GEO_TIMEOUT = 3;

function getGeolocationErrorMessage(code: number, message?: string): string {
  switch (code) {
    case GEO_PERMISSION_DENIED:
      return "Accès refusé. Autorisez la géolocalisation pour ce site dans les paramètres du navigateur.";
    case GEO_POSITION_UNAVAILABLE:
      return "Position indisponible. Vérifiez le GPS/Wi‑Fi, les réglages macOS → Confidentialité → Localisation (Chrome), ou désactivez VPN/bloqueurs.";
    case GEO_TIMEOUT:
      return "Délai dépassé. Réessayez dans un endroit avec un meilleur signal.";
    default: {
      if (message) {
        return `Impossible d'obtenir votre position actuelle (${code}: ${message}). Saisissez l'adresse manuellement.`;
      }
      if (code) {
        return `Impossible d'obtenir votre position actuelle (code ${code}). Saisissez l'adresse manuellement.`;
      }
      return "Impossible d'obtenir votre position actuelle. Saisissez l'adresse manuellement.";
    }
  }
}

function getCurrentPosition(
  options?: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function isGeolocationPositionError(
  error: unknown,
): error is GeolocationPositionError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as GeolocationPositionError).code === "number"
  );
}

function pickRicherGeoError(a: unknown, b: unknown): unknown {
  const rank = (err: unknown): number => {
    if (!isGeolocationPositionError(err)) return 0;
    if (err.code === GEO_PERMISSION_DENIED) return 3;
    if (err.code === GEO_TIMEOUT) return 2;
    if (err.code === GEO_POSITION_UNAVAILABLE) return 1;
    return 0;
  };
  return rank(a) >= rank(b) ? a : b;
}

/**
 * Race high-accuracy and coarse fixes; take the first success.
 * Always set timeout — Chrome can hang forever with default Infinity.
 */
async function getPositionWithFallback(): Promise<GeolocationPosition> {
  const high = getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });
  const coarse = getCurrentPosition({
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 60000,
  });

  const settled = await Promise.allSettled([high, coarse]);
  const success = settled.find(
    (r): r is PromiseFulfilledResult<GeolocationPosition> =>
      r.status === "fulfilled",
  );
  if (success) return success.value;

  const errors = settled
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => r.reason);

  let richest: unknown = errors[0];
  for (let i = 1; i < errors.length; i += 1) {
    richest = pickRicherGeoError(richest, errors[i]);
  }
  throw richest;
}

export function AutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  onSelect,
  className,
  defaultValue,
}: Readonly<AutocompleteInputProps>) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string>(value || defaultValue || "");
  const debouncedQuery = useDebounce<string>(query, 300);
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLocationHint, setShowLocationHint] = useState(false);
  const locationHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressSuggestionsRef = useRef(false);
  const skipNextValueSync = useRef(false);
  const { toast } = useToast();

  // Two-line expand is mobile-only — desktop has enough horizontal room.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const shouldExpand =
    isMobile &&
    (isFocused || query.trim().length > 28 || query.includes("\n"));

  const clearLocationHintTimer = () => {
    if (locationHintTimer.current) {
      clearTimeout(locationHintTimer.current);
      locationHintTimer.current = null;
    }
  };

  const handleLocationButtonEnter = () => {
    clearLocationHintTimer();
    locationHintTimer.current = setTimeout(() => {
      setShowLocationHint(true);
    }, 2000);
  };

  const handleLocationButtonLeave = () => {
    clearLocationHintTimer();
    setShowLocationHint(false);
  };

  useEffect(() => {
    return () => clearLocationHintTimer();
  }, []);

  useEffect(() => {
    if (suppressSuggestionsRef.current || !hasUserInteracted) {
      return;
    }

    const cleanQuery = String(debouncedQuery || "")
      .trim()
      .replace(/[^\w\s]/g, "");
    if (cleanQuery.length > 2) {
      fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cleanQuery)}&limit=5&autocomplete=1`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (suppressSuggestionsRef.current) return;
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
        description:
          "Votre navigateur ne prend pas en charge la géolocalisation.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    setSuggestions([]);
    try {
      const position = await getPositionWithFallback();
      const { latitude: lat, longitude: lon, accuracy } = position.coords;

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        toast({
          title: "Géolocalisation impossible",
          description: "Coordonnées invalides reçues du navigateur.",
          variant: "destructive",
        });
        return;
      }

      const geocoded = await reverseGeocode(lat, lon);
      const resolved =
        geocoded ?? `Ma position (${lat.toFixed(5)}, ${lon.toFixed(5)})`;

      // Fill input; keep suggestions suppressed until the user types.
      suppressSuggestionsRef.current = true;
      skipNextValueSync.current = true;
      setSuggestions([]);
      setHasUserInteracted(true);
      setQuery(resolved);
      onChange?.(resolved);
      onSelect?.(lat, lon, resolved);

      if (!geocoded) {
        toast({
          title: "Adresse approximative",
          description:
            "Position obtenue, mais aucune adresse postale précise n'a été trouvée.",
        });
      } else if (typeof accuracy === "number" && accuracy > 500) {
        toast({
          title: "Position approximative",
          description: `Précision estimée ±${Math.round(accuracy)} m. Vérifiez ou corrigez l'adresse si besoin.`,
        });
      }
    } catch (error) {
      const description = isGeolocationPositionError(error)
        ? getGeolocationErrorMessage(error.code, error.message)
        : "Impossible d'obtenir votre position actuelle. Saisissez l'adresse manuellement.";
      toast({
        title: "Géolocalisation impossible",
        description,
        variant: "destructive",
      });
      console.warn("[AutocompleteInput] geolocation failed", error);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (value === undefined || isLocating) return;
    if (skipNextValueSync.current) {
      skipNextValueSync.current = false;
      return;
    }
    setQuery(value);
  }, [value, isLocating]);

  useEffect(() => {
    if (defaultValue) {
      setQuery(defaultValue);
    }
  }, [defaultValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.replaceAll("\n", " ");
    suppressSuggestionsRef.current = false;
    setHasUserInteracted(true);
    setQuery(newValue);
    onChange?.(newValue);

    if (newValue === "") {
      setSuggestions([]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <textarea
          id={id}
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          ref={inputRef}
          rows={shouldExpand ? 2 : 1}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            styles.addressField,
            shouldExpand
              ? styles.addressFieldExpanded
              : styles.addressFieldCollapsed,
            className,
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions.length > 0) {
                const feature = suggestions[0];
                const lat = feature.geometry.coordinates[1];
                const lon = feature.geometry.coordinates[0];
                onSelect?.(lat, lon, feature.properties.label);
                suppressSuggestionsRef.current = true;
                setQuery(feature.properties.label);
                setSuggestions([]);
              }
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleGeolocation}
          onMouseEnter={handleLocationButtonEnter}
          onMouseLeave={handleLocationButtonLeave}
          onFocus={handleLocationButtonEnter}
          onBlur={handleLocationButtonLeave}
          className={cn(styles.locationButton, "rounded-full")}
          disabled={isLocating}
          aria-label="Utiliser ma position actuelle"
        >
          {isLocating ? (
            "⌛"
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.locationIcon}
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </Button>
        {showLocationHint ? (
          <span className={styles.locationTooltip} role="tooltip">
            Ma position actuelle
          </span>
        ) : null}
        {suggestions.length > 0 && (
          <ul className={styles.suggestions} role="listbox">
            {suggestions.map((feature) => {
              const label = feature.properties.label;
              const [lon, lat] = feature.geometry.coordinates;
              return (
                <li
                  key={`${label}-${lon}-${lat}`}
                  role="option"
                  aria-selected={false}
                >
                  <button
                    type="button"
                    className={styles.suggestion}
                    onClick={() => {
                      onSelect?.(lat, lon, label);
                      suppressSuggestionsRef.current = true;
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
    </div>
  );
}

