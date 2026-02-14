"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Navigation,
  MapPin,
  Flag,
  AlertCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDriverStore } from "@/lib/driver/store";
import { usePendingRides } from "@/lib/driver/usePendingRides";
import {
  formatPrice,
  formatDistance,
  formatDuration,
} from "@/lib/driver/utils";
import type { Ride } from "@/lib/driver/types";
import { RideRequestMap } from "./RideRequestMap";
import { NeonProgress } from "@/components/ui/NeonProgress";
import { NeonSwipeButton } from "@/components/ui/NeonSwipeButton";
import { getDirections } from "@/lib/services/directionsService";

const COUNTDOWN_SECONDS = 20;

// NeonProgress gère l'animation en DOM pour éviter des setState par frame

// Badge de rentabilité
function RentabilityBadge({
  distance,
  price,
}: {
  distance: number;
  price: number;
}) {
  const perKm = distance > 0 ? price / distance : 0;
  if (perKm >= 2.5) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
        <TrendingUp className="w-3.5 h-3.5" />
        <span>Excellente</span>
      </div>
    );
  } else if (perKm >= 1.5) {
    return (
      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
        <Zap className="w-3.5 h-3.5" />
        <span>Bonne</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
      <span>Standard</span>
    </div>
  );
}

export function FullscreenRideModal() {
  // Ouvre la modale manuellement (clic sur "voir détails")
  useEffect(() => {
    const handleOpen = (e: CustomEvent<Ride>) => {
      if (e.detail) {
        pendingRideRef.current = e.detail;
        setMapReady(false);
        setIsOpen(true);
        setCountdown(COUNTDOWN_SECONDS);
        progressStartKeyRef.current = Date.now();
        progressStartTsRef.current = performance.now();
        setError(null);
      }
    };
    window.addEventListener("open-ride-modal", handleOpen as EventListener);
    return () =>
      window.removeEventListener(
        "open-ride-modal",
        handleOpen as EventListener,
      );
  }, []);
  // Déclarations de hooks en premier (ordre React)
  const { availableRide, currentLocation } = useDriverStore();
  const { acceptCurrentRide, declineCurrentRide } = usePendingRides();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [driverToPickupRoute, setDriverToPickupRoute] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const pendingRideRef = useRef<Ride | null>(null);
  const prevRideIdRef = useRef<string | null>(null);
  // progress visualisé par NeonProgress (DOM-driven)
  const progressStartKeyRef = useRef<number>(0);
  const progressStartTsRef = useRef<number | null>(null);
  const [isShortHeight, setIsShortHeight] = useState(false);

  useEffect(() => {
    const check = () => setIsShortHeight(window.innerHeight <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Callback pour refuser la course
  const handleDecline = useCallback(() => {
    declineCurrentRide();
    setIsOpen(false);
  }, [declineCurrentRide]);

  // Ouvre la modale automatiquement dès qu'une nouvelle course arrive
  useEffect(() => {
    if (
      availableRide &&
      availableRide.id !== prevRideIdRef.current &&
      !isOpen
    ) {
      setIsOpen(true);
      setCountdown(COUNTDOWN_SECONDS);
      progressStartKeyRef.current = Date.now();
      progressStartTsRef.current = performance.now();
      setError(null);
      pendingRideRef.current = availableRide;
      prevRideIdRef.current = availableRide.id;
    }
  }, [availableRide, isOpen]);

  // Countdown léger: NeonProgress fait l'animation visuelle en DOM, on met à jour uniquement le countdown
  useEffect(() => {
    if (!isOpen || !availableRide) return;
    const totalMs = COUNTDOWN_SECONDS * 1000;
    progressStartKeyRef.current = Date.now();
    progressStartTsRef.current = performance.now();

    const tick = () => {
      if (!progressStartTsRef.current) return;
      const remaining = Math.max(
        0,
        totalMs - (performance.now() - progressStartTsRef.current),
      );
      setCountdown(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        handleDecline();
      }
    };

    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [isOpen, availableRide, handleDecline]);

  useEffect(() => {
    if (countdown === 0 && isOpen) {
      const t = setTimeout(() => handleDecline(), 100);
      return () => clearTimeout(t);
    }
  }, [countdown, isOpen, handleDecline]);
  // (déjà déclaré plus haut)

  // Récupérer le trajet réel chauffeur → pickup
  useEffect(() => {
    if (!currentLocation || !availableRide || !isOpen) return;

    const fetchDriverRoute = async () => {
      try {
        const data = await getDirections({
          start: { lng: currentLocation.lng, lat: currentLocation.lat },
          end: { lng: availableRide.pickupLng, lat: availableRide.pickupLat },
        });
        const summary = data.features?.[0]?.properties?.summary;
        if (summary) {
          setDriverToPickupRoute({
            distance: summary.distance,
            duration: summary.duration,
          });
        }
      } catch (e) {
        console.error("Erreur route chauffeur:", e);
      }
    };

    fetchDriverRoute();
  }, [currentLocation, availableRide, isOpen]);

  const handleAccept = async () => {
    if (!availableRide || isAccepting) return;
    setIsAccepting(true);
    try {
      const result = await acceptCurrentRide();
      if (result.success) {
        setIsOpen(false);
      } else {
        setError(result.error || "Erreur");
        setIsAccepting(false);
      }
    } catch {
      setError("Erreur");
      setIsAccepting(false);
    }
  };

  const handleClose = () => setIsOpen(false);

  // Mémoriser les coordonnées AVANT le return conditionnel
  const rideToShow = pendingRideRef.current || availableRide;

  const pickupCoords = useMemo(
    () =>
      rideToShow
        ? {
            lat: rideToShow.pickupLat,
            lng: rideToShow.pickupLng,
          }
        : { lat: 0, lng: 0 },
    [rideToShow?.pickupLat, rideToShow?.pickupLng],
  );

  const dropoffCoords = useMemo(
    () =>
      rideToShow
        ? {
            lat: rideToShow.dropoffLat,
            lng: rideToShow.dropoffLng,
          }
        : { lat: 0, lng: 0 },
    [rideToShow?.dropoffLat, rideToShow?.dropoffLng],
  );

  // Afficher la modal dès que isOpen est true
  if (!rideToShow || !isOpen) return null;

  const isUrgent = countdown <= 5;

  // Trajet client depuis la BDD (pickup → dropoff)
  const tripDistKm = rideToShow.estimatedDistance || 0;
  const tripTimeMin = rideToShow.estimatedDuration || 0;

  // Trajet chauffeur → pickup (API)
  const driverDistKm = driverToPickupRoute
    ? driverToPickupRoute.distance / 1000
    : 0;
  const driverTimeMin = driverToPickupRoute
    ? Math.round(driverToPickupRoute.duration / 60)
    : 0;

  // Couleur en fonction de la distance client
  const getDistanceColor = (km: number) => {
    if (km <= 5) return "text-emerald-400";
    if (km <= 15) return "text-cyan-400";
    if (km <= 30) return "text-amber-400";
    return "text-rose-400";
  };

  // Couleur pour aller chercher
  const getPickupColor = (km: number) => {
    if (km <= 3) return "text-emerald-400";
    if (km <= 8) return "text-cyan-400";
    if (km <= 15) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xl"
          style={{ padding: isShortHeight ? 0 : undefined }}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={`w-full max-w-md overflow-hidden border bg-[rgba(255,255,255,0.02)] shadow-2xl backdrop-blur-3xl flex flex-col ${
              isShortHeight ? "rounded-none" : "rounded-xl"
            }`}
            style={{
              height: isShortHeight ? "100vh" : undefined,
              // make modal taller on larger viewports (less inset)
              maxHeight: isShortHeight ? "100vh" : "calc(100vh - 40px)",
              width: "100%",
              borderColor: "rgba(255,255,255,0.06)",
               boxShadow:
                 "inset 0 1px 0 rgba(255,255,255,0.02), 0 18px 60px rgba(2,6,23,0.65), 0 6px 24px rgba(70,130,180,0.06)",
              background:
                "linear-gradient(180deg, rgba(70,130,180,0.03), rgba(255,255,255,0.008))",
            }}
          >
            {/* Glass overlay for entire modal */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)), radial-gradient(1000px 120px at 10% 6%, rgba(255,255,255,0.08), rgba(255,255,255,0) 10%)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: "inset 0 2px 14px rgba(255,255,255,0.02)",
                zIndex: 0,
              }}
            />
            <div className="px-6 pb-6 pt-2 flex flex-col gap-2 relative z-10">
              {/* Progress bar placée en haut de la modal */}
              <div className="w-full px-2 pb-2 pt-2 h-12 flex items-center">
                <NeonProgress
                  durationMs={COUNTDOWN_SECONDS * 1000}
                  startKey={progressStartKeyRef.current}
                  onExpire={handleDecline}
                />
              </div>

              {/* Approche sur une ligne */}
              <div
                className="rounded-md border border-[#f9c2c2] flex items-center px-3 py-2 gap-2 shadow-inner"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(247, 211, 211, 0.98) 0%, hsla(0, 100%, 100%, 0.92) 100%)",
                }}
              >
                <AlertCircle className="h-5 w-5 text-[#a0303a]" />
                <span
                  className={`font-extrabold uppercase text-[#7c2230] tracking-wide whitespace-nowrap ${
                    isShortHeight ? "text-sm" : "text-lg"
                  }`}
                >
                  APPROCHE (
                  {driverTimeMin > 0
                    ? `${formatDuration(driverTimeMin)} · ${driverDistKm.toFixed(0)} km`
                    : "..."}
                  )
                </span>
              </div>

              {/* Carte + header PRIX sur une ligne */}
              <div className="w-full rounded-md overflow-hidden border border-white/18 shadow-md">
                <div
                  className="bg-[#e6fff2] border-b border-white/20 px-4 py-2.5 flex items-center gap-4"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(216, 251, 233, 0.98) 0%, rgba(242, 251, 247, 0.92) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`tracking-wide text-[#065f46] whitespace-nowrap ${
                        isShortHeight
                          ? "text-sm font-extrabold"
                          : "text-lg font-extrabold"
                      }`}
                    >
                      {formatPrice(rideToShow.estimatedPrice || 0)}
                    </span>
                    <span
                      className={`${isShortHeight ? "text-sm" : "text-lg"} text-[#065f46]`}
                    >
                      |
                    </span>
                    <span
                      className={`${isShortHeight ? "text-sm" : "text-lg"} text-[#065f46] whitespace-nowrap`}
                    >
                      {formatDuration(tripTimeMin)} · {tripDistKm.toFixed(0)} km
                    </span>
                  </div>

                  {/* header content (prix + durée) */}
                </div>

                <div
                  className={`bg-white relative ${isShortHeight ? "h-80" : "h-[460px]"}`}
                >
                  <RideRequestMap
                    pickup={pickupCoords}
                    dropoff={dropoffCoords}
                    driverLocation={currentLocation}
                    onReady={() => setMapReady(true)}
                  />

                  <div className="absolute bottom-0 left-0 right-0 flex flex-col z-10">
                    <div className="flex items-center gap-2 bg-white/95 px-2 py-1 rounded border border-white/40 shadow-sm">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-slate-700 truncate whitespace-nowrap">
                        Départ : {rideToShow.pickupLocation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/95 px-2 py-1 rounded border border-white/40 shadow-sm">
                      <Flag className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs text-slate-700 truncate font-bold whitespace-nowrap">
                        {rideToShow.dropoffLocation}
                      </span>
                    </div>
                  </div>

                  {!mapReady && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
                      <div className="w-10 h-10 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton large type capture : pill + knob draggable (extrait) */}
              <div className="w-full flex flex-col items-center mt-3">
                <div className="w-[92%] relative">
                  <NeonSwipeButton onConfirm={handleAccept} />
                </div>

                <button
                  onClick={handleDecline}
                  className="mt-3 text-sm text-slate-300/80"
                >
                  Décliner
                </button>
              </div>
              {error && (
                <div className="mt-2 p-2 bg-gradient-to-r from-rose-500/20 to-rose-600/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm text-center">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
