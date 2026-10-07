"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import { useRouter, useSearchParams } from "next/navigation";
import { Coordinates } from "../lib/types/map-types";
import {
  type VehicleType,
  type VehicleOptions,
  selectedFromVehicleOptions,
  vehicleOptionsFromSelected,
} from "../lib/vehicle";
import { normalizeSelectedOptions } from "../lib/services/optionsCatalogService";
import { shouldResumeReservationDraft } from "../lib/reservation/resumeDraft";
import { useReservationStore } from "../lib/stores/reservationStore";
import { normalizePickupDateTime } from "../lib/utils/normalizePickupDateTime";
import { validateVehicleType } from "../lib/utils/vehicle";

interface LocationState {
  raw: string;
  validated: { location: Coordinates } | null;
}

const DEFAULT_LOCATION_STATE: LocationState = {
  raw: "",
  validated: null,
};

export function useReservation() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const reservationStore = useReservationStore();
  const didApplyRebookRef = useRef(false);

  /**
   * Une nouvelle réservation part d'un brouillon **vide** ; seul un retour explicite dans le
   * tunnel relit le brouillon persisté (voir `shouldResumeReservationDraft`, testé).
   *
   * Sans ce garde-fou, le brouillon persisté n'étant jamais effacé, les options d'une course
   * précédente restaient cochées et étaient ajoutées à la course suivante — mesuré sur le cloud :
   * 217 courses portaient exactement les deux mêmes options sans que le client les ait choisies.
   */
  const resumeDraft = shouldResumeReservationDraft({
    modify: searchParams?.get("modify") ?? null,
    rebook: searchParams?.get("rebook") ?? null,
    editingId:
      typeof window !== "undefined"
        ? localStorage.getItem("currentEditingReservationId")
        : null,
  });
  /** Le brouillon relu, ou `null` pour une nouvelle réservation. */
  const seeded = resumeDraft ? reservationStore : null;

  // Standardisation sur lon et gestion des cas null
  const [origin, setOrigin] = useState<Coordinates | undefined>(() => {
    if (!seeded?.departure) return undefined;
    return {
      lat: seeded.departure.lat,
      lon: seeded.departure.lon,
    };
  });

  const [destination, setDestination] = useState<Coordinates | undefined>(
    () => {
      if (!seeded?.destination || !seeded.departure) return undefined;
      return {
        lat: seeded.destination.lat,
        lon: seeded.destination.lon,
      };
    },
  );

  // Reste du code inchangé
  const [originAddress, setOriginAddress] = useState(
    seeded?.departure?.display_name || "",
  );
  const [destinationAddress, setDestinationAddress] = useState(
    seeded?.destination?.display_name || "",
  );
  const [pickupDateTime, setPickupDateTime] = useState(() => {
    return normalizePickupDateTime(seeded?.pickupDateTime || new Date());
  });
  const didNormalizePickupRef = useRef(false);

  /**
   * Une nouvelle réservation efface le brouillon que la précédente a laissé : c'est ce qui
   * empêche les options d'une course terminée de se retrouver cochées sur la suivante. Une
   * reprise explicite garde le sien.
   */
  useEffect(() => {
    if (resumeDraft) return;
    useReservationStore.getState().reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une fois au montage
  }, []);

  // Create mode only: bump stale draft datetime to now+min lead (keep addresses).
  useEffect(() => {
    if (didNormalizePickupRef.current) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem("currentEditingReservationId")) return;
    didNormalizePickupRef.current = true;
    // La date locale est déjà normalisée à la graine (`seeded?.pickupDateTime`) : pour une
    // nouvelle réservation c'est maintenant + délai mini, jamais la date de la course précédente.
    // Lire `reservationStore.pickupDateTime` ici relisait le brouillon périmé et reportait la
    // date d'une course sur la suivante.
    reservationStore.setPickupDateTime(pickupDateTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount for create flow
  }, []);

  const [distance, setDistance] = useState(seeded?.distance || 0);
  const [duration, setDuration] = useState(seeded?.duration || 0);
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    (seeded?.selectedVehicle as VehicleType) || "STANDARD",
  );
  const [pickup, setPickup] = useState<LocationState>(DEFAULT_LOCATION_STATE);
  const [dropoff, setDropoff] = useState<LocationState>(DEFAULT_LOCATION_STATE);
  const [options, setOptions] = useState<VehicleOptions>(() =>
    vehicleOptionsFromSelected(normalizeSelectedOptions(seeded?.selectedOptions)),
  );

  // Prefill from system-expire rebook CTA (?rebook=1&from=&to=&…).
  useEffect(() => {
    if (didApplyRebookRef.current) return;
    if (searchParams?.get("rebook") !== "1") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem("currentEditingReservationId")) return;
    didApplyRebookRef.current = true;

    const from = searchParams.get("from")?.trim() || "";
    const to = searchParams.get("to")?.trim() || "";
    const fromLat = Number(searchParams.get("from_lat"));
    const fromLon = Number(searchParams.get("from_lon"));
    const toLat = Number(searchParams.get("to_lat"));
    const toLon = Number(searchParams.get("to_lon"));
    const vehicle = validateVehicleType(searchParams.get("vehicle"));
    const optionsRaw = searchParams.get("options");
    const optionNames = optionsRaw
      ? normalizeSelectedOptions(
          optionsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        )
      : [];

    const hasFromCoords =
      Number.isFinite(fromLat) && Number.isFinite(fromLon) && from.length > 0;
    const hasToCoords =
      Number.isFinite(toLat) && Number.isFinite(toLon) && to.length > 0;

    if (hasFromCoords) {
      const coords = { lat: fromLat, lon: fromLon };
      setOrigin(coords);
      setOriginAddress(from);
      setPickup({ raw: from, validated: { location: coords } });
      reservationStore.setDeparture({
        lat: fromLat,
        lon: fromLon,
        display_name: from,
        address: {},
      });
    } else if (from) {
      setOriginAddress(from);
    }

    if (hasToCoords) {
      const coords = { lat: toLat, lon: toLon };
      setDestination(coords);
      setDestinationAddress(to);
      setDropoff({ raw: to, validated: { location: coords } });
      reservationStore.setDestination({
        lat: toLat,
        lon: toLon,
        display_name: to,
        address: {},
      });
    } else if (to) {
      setDestinationAddress(to);
    }

    if (vehicle) {
      setVehicleType(vehicle);
      reservationStore.setSelectedVehicle(vehicle);
    }
    if (optionNames.length > 0) {
      setOptions(vehicleOptionsFromSelected(optionNames));
      reservationStore.setSelectedOptions(optionNames);
    }

    const normalized = normalizePickupDateTime(new Date());
    setPickupDateTime(normalized);
    reservationStore.setPickupDateTime(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply query once
  }, [searchParams]);

  const handleNextStep = useCallback(() => {
    const storeOrigin = reservationStore.departure;
    const storeDestination = reservationStore.destination;

    const isFiniteCoords = (
      loc: { lat?: number | null; lon?: number | null } | null | undefined,
    ) =>
      loc != null &&
      typeof loc.lat === "number" &&
      typeof loc.lon === "number" &&
      Number.isFinite(loc.lat) &&
      Number.isFinite(loc.lon);

    let resolvedOrigin = isFiniteCoords(origin) ? origin : undefined;
    if (!resolvedOrigin && isFiniteCoords(storeOrigin)) {
      resolvedOrigin = { lat: storeOrigin!.lat, lon: storeOrigin!.lon };
    }

    let resolvedDestination = isFiniteCoords(destination)
      ? destination
      : undefined;
    if (!resolvedDestination && isFiniteCoords(storeDestination)) {
      resolvedDestination = {
        lat: storeDestination!.lat,
        lon: storeDestination!.lon,
      };
    }

    const originLabel = originAddress || storeOrigin?.display_name || "";
    const destinationLabel =
      destinationAddress || storeDestination?.display_name || "";

    if (
      !resolvedOrigin ||
      !resolvedDestination ||
      !originLabel ||
      !destinationLabel
    ) {
      toast({
        title: "Adresse manquante",
        description:
          "Veuillez sélectionner un point de départ et une destination valides.",
        variant: "destructive",
      });
      return;
    }

    if (!origin) {
      setOrigin(resolvedOrigin);
      setOriginAddress(storeOrigin?.display_name || originLabel);
    }

    if (!destination) {
      setDestination(resolvedDestination);
      setDestinationAddress(storeDestination?.display_name || destinationLabel);
    }

    setStep((prev) => Math.min(prev + 1, 2));
  }, [
    origin,
    destination,
    originAddress,
    destinationAddress,
    toast,
    reservationStore,
  ]);

  const router = useRouter();

  // Utilisation cohérente de lon
  const handleReservation = useCallback(() => {
    console.log("handleReservation called");
    if (!origin || !destination) {
      toast({
        title: "Please select a departure and destination point",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update store with all information with lon
      if (origin && destination) {
        reservationStore.setDeparture({
          lat: origin.lat,
          lon: origin.lon,
          display_name: originAddress,
          address: {},
        });

        reservationStore.setDestination({
          lat: destination.lat,
          lon: destination.lon,
          display_name: destinationAddress,
          address: {},
        });
      }
      reservationStore.setSelectedVehicle(vehicleType);
      reservationStore.setDistance(distance);
      reservationStore.setDuration(duration);
      reservationStore.setPickupDateTime(pickupDateTime);

      // Persist selected option names (catalog / DB)
      const newSelectedOptions = normalizeSelectedOptions(
        selectedFromVehicleOptions(options),
      );
      reservationStore.setSelectedOptions(newSelectedOptions);

      // Vérifier si nous sommes en mode édition
      const editingId = localStorage.getItem("currentEditingReservationId");
      const urlParams = editingId ? `?edit=true&id=${editingId}` : "";

      // Use Next.js router for navigation - toujours rediriger vers la page de confirmation
      router.push(`/reservation/confirmation${urlParams}`);
    } catch (error) {
      console.error("Error saving reservation:", error);
      toast({
        title: "An error occurred while saving the reservation",
        variant: "destructive",
      });
    }
  }, [
    origin,
    destination,
    originAddress,
    destinationAddress,
    vehicleType,
    options,
    distance,
    duration,
    pickupDateTime,
    router,
    reservationStore,
    toast,
  ]);

  const handlePrevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // Mise à jour des gestionnaires pour utiliser lon et gérer les valeurs nulles
  const handleOriginSelect = useCallback(
    (address: string, coords: Coordinates) => {
      if (!address || address.trim() === "") {
        setOrigin(undefined);
        setOriginAddress("");
        setPickup(DEFAULT_LOCATION_STATE);
        // Réinitialiser le store avec null explicitement
        reservationStore.setDeparture(null);
        // Réinitialiser la distance et la durée car l'itinéraire n'est plus valide
        setDistance(0);
        setDuration(0);
        reservationStore.setDistance(0);
        reservationStore.setDuration(0);
      } else {
        setOrigin(coords);
        setOriginAddress(address);
        setPickup({
          raw: address,
          validated: { location: coords },
        });
        // Mettre à jour le store avec un objet Location valide
        reservationStore.setDeparture({
          lat: coords.lat,
          lon: coords.lon,
          display_name: address,
          address: {},
        });
      }
    },
    [reservationStore],
  );

  const handleDestinationSelect = useCallback(
    (address: string, coords: Coordinates) => {
      if (!address || address.trim() === "") {
        setDestination(undefined);
        setDestinationAddress("");
        setDropoff(DEFAULT_LOCATION_STATE);
        // Réinitialiser le store avec null explicitement
        reservationStore.setDestination(null);
        // Réinitialiser la distance et la durée car l'itinéraire n'est plus valide
        setDistance(0);
        setDuration(0);
        reservationStore.setDistance(0);
        reservationStore.setDuration(0);
      } else {
        setDestination(coords);
        setDestinationAddress(address);
        setDropoff({
          raw: address,
          validated: { location: coords },
        });
        // Mettre à jour le store avec un objet Location valide
        reservationStore.setDestination({
          lat: coords.lat,
          lon: coords.lon,
          display_name: address,
          address: {},
        });
      }
    },
    [reservationStore],
  );

  const handleRouteCalculated = useCallback(
    (newDistance: number, newDuration: number) => {
      // Convert distance from meters to kilometers
      const distanceKm = Math.round(newDistance / 1000);
      // Duration is in seconds, convert to minutes
      const durationMin = Math.round(newDuration / 60);

      // Mettre à jour l'état local
      setDistance(distanceKm);
      setDuration(durationMin);

      // Mettre à jour le store
      reservationStore.setDistance(distanceKm);
      reservationStore.setDuration(durationMin);
    },
    [reservationStore],
  );

  const handleOptionsChange = useCallback(
    (newOptions: VehicleOptions) => {
      setOptions(newOptions);
      reservationStore.setSelectedOptions(
        normalizeSelectedOptions(selectedFromVehicleOptions(newOptions)),
      );
    },
    [reservationStore],
  );

  return {
    step,
    origin,
    destination,
    originAddress,
    destinationAddress,
    pickupDateTime,
    distance,
    duration,
    vehicleType,
    options,
    pickup,
    dropoff,
    handleNextStep,
    handlePrevStep,
    handleReservation,
    handleOriginSelect,
    handleDestinationSelect,
    handleRouteCalculated,
    setPickupDateTime,
    setOriginAddress,
    setDestinationAddress,
    setVehicleType,
    setOptions: handleOptionsChange,
  };
}
