"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Clock,
  Calendar,
  Play,
  MapPin,
  Navigation,
  DollarSign,
  ChevronUp,
  Circle,
} from "lucide-react";
import { useDriverStore } from "@/lib/driver/store";
import { supabase } from "@/lib/database/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  formatPrice,
  formatDistance,
  formatDuration,
} from "@/lib/driver/utils";
import type { Ride } from "@/lib/driver/types";
import { driverRideService } from "@/lib/driver/rideService";
import {
  openExternalNavigation,
  changePreferredNavApp,
} from "@/lib/driver/externalNavigation";
import {
  getPreferredNavApp,
  NAV_APP_LABELS,
} from "@/lib/driver/navAppPreference";

type Tab = "available" | "scheduled" | "active";

// Positions Y (translateY) pour chaque état - % de la hauteur cachée
// 0% = tout en haut (plein écran), 100% = tout en bas (caché)
const SHEET_POSITIONS = {
  collapsed: "75%", // Montre 25% en bas
  peek: "55%", // Montre 45%
  expanded: "0%", // Plein écran
};

export function DriverBottomSheet() {
  const { isOnline, activeRide, availableRide } = useDriverStore();
  const router = useRouter();
  const [driverAuth, setDriverAuth] = useState<{
    checking: boolean;
    canAccept: boolean | null;
    reason?: string | null;
  }>({ checking: true, canAccept: null, reason: null });
  const [activeTab, setActiveTab] = useState<Tab>(
    activeRide ? "active" : "available",
  );
  const [sheetState, setSheetState] = useState<
    "collapsed" | "peek" | "expanded"
  >("peek");

  const constraintsRef = useRef<HTMLDivElement>(null);

  const scheduledRides: Ride[] = [];

  const handleDragEnd = (event: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Tirer vers le HAUT (négatif) = monter le sheet
    if (velocity < -200 || offset < -40) {
      if (sheetState === "collapsed") setSheetState("peek");
      else if (sheetState === "peek") setSheetState("expanded");
    }
    // Tirer vers le BAS (positif) = descendre le sheet
    else if (velocity > 200 || offset > 40) {
      if (sheetState === "expanded") setSheetState("peek");
      else if (sheetState === "peek") setSheetState("collapsed");
    }
  };

  const getSheetPosition = () => {
    switch (sheetState) {
      case "collapsed":
        return SHEET_POSITIONS.collapsed;
      case "peek":
        return SHEET_POSITIONS.peek;
      case "expanded":
        return SHEET_POSITIONS.expanded;
    }
  };

  const handleOpenRealtimeModal = () => {
    if (availableRide) {
      // Before opening the ride modal, ensure driver is authorized to accept
      if (driverAuth.checking) return; // still checking
      if (driverAuth.canAccept === false) {
        // show bottomsheet warning (reuse router to redirect to profile)
        window.dispatchEvent(new CustomEvent("open-driver-profile-warning", { detail: { reason: driverAuth.reason } }));
        return;
      }

      window.dispatchEvent(
        new CustomEvent("open-ride-modal", { detail: availableRide }),
      );
    }
  };

  // Fetch driver authorization status once on mount
  useEffect(() => {
    let mounted = true;
    async function check() {
        try {
          // call Edge Function we created earlier
          // Resolve functions URL from environment when available (preferred),
          // otherwise fall back to local dev host at :54321.
          const getFnUrl = () => {
            const functionsBase = (process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL as string) || (process.env.NEXT_PUBLIC_SUPABASE_URL as string);
            if (functionsBase) {
              return `${functionsBase.replace(/\/$/, "")}/functions/v1/driver-authorization`;
            }
            const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
            const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
            return `${protocol}//${host}:54321/functions/v1/driver-authorization`;
          };
          const fnUrl = getFnUrl();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          if (!mounted) return;
          setDriverAuth({ checking: false, canAccept: false, reason: 'Utilisateur non authentifié' });
          return;
        }

        const res = await fetch(`${fnUrl}?user_id=${encodeURIComponent(userId)}`, {
          headers: { Accept: 'application/json' },
          credentials: 'omit',
        });
        const json = await res.json();
        if (!mounted) return;
        if (json?.ok) {
          setDriverAuth({ checking: false, canAccept: !!json.can_accept, reason: json.reason ?? null });
        } else {
          setDriverAuth({ checking: false, canAccept: false, reason: json?.error ?? 'Erreur inconnue' });
        }
      } catch (err) {
        if (!mounted) return;
        setDriverAuth({ checking: false, canAccept: false, reason: String(err) });
      }
    }
    check();
    return () => { mounted = false };
  }, []);

  return (
    <>
      {/* Bottom Sheet - hauteur fixe 100vh, animé avec translateY */}
      <motion.div
        ref={constraintsRef}
        className="fixed left-0 right-0 bottom-0 z-40 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 rounded-t-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] border-t border-white/10 overflow-hidden select-none h-[100dvh] backdrop-blur-xl"
        initial={{ y: "100%" }}
        animate={{
          y: getSheetPosition(),
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag={"y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {/* Handle */}
        <div
          className="w-full flex flex-col items-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
          onClick={() => {
            if (sheetState === "expanded") setSheetState("peek");
            else if (sheetState === "peek") setSheetState("expanded");
            else setSheetState("peek");
          }}
        >
          <div className="w-14 h-2 bg-gradient-to-r from-neutral-700 via-neutral-500 to-neutral-700 rounded-full mb-2 shadow-sm" />
          <ChevronUp
            className={`w-6 h-6 text-neutral-400 transition-transform duration-300 ${
              sheetState === "expanded" ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Header avec tabs et toggle compact */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 rounded-2xl p-1 shadow-lg border border-white/5">
              <TabButton
                active={activeTab === "available"}
                onClick={() => setActiveTab("available")}
                icon={Clock}
                badge={availableRide ? 1 : 0}
                color="emerald"
              />
              <TabButton
                active={activeTab === "scheduled"}
                onClick={() => setActiveTab("scheduled")}
                icon={Calendar}
                badge={scheduledRides.length}
                color="blue"
              />
              <TabButton
                active={activeTab === "active"}
                onClick={() => setActiveTab("active")}
                icon={Play}
                badge={activeRide ? 1 : 0}
                color="amber"
              />
            </div>
          </div>
        </div>
        {/* If driver not allowed, show a small banner inside the sheet */}
        {!driverAuth.checking && driverAuth.canAccept === false && (
          <div className="px-6 pb-2">
            <div className="bg-yellow-700/10 border border-yellow-600/20 rounded-xl p-3 text-sm text-yellow-200 flex items-center justify-between">
              <div>
                <div className="font-semibold">Votre profil est incomplet</div>
                <div className="text-xs text-yellow-300">{driverAuth.reason}</div>
              </div>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/driver-portal/profile/setup?from=driver-setup')}
                >
                  Compléter
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 overflow-y-auto h-[calc(100%-110px)]">
          <AnimatePresence mode="wait">
            {activeTab === "available" && (
              <AvailableTab
                key="available"
                ride={availableRide}
                isOnline={isOnline}
                onOpenModal={handleOpenRealtimeModal}
                compact={sheetState === "collapsed"}
              />
            )}
            {activeTab === "scheduled" && (
              <ScheduledTab key="scheduled" rides={scheduledRides} />
            )}
            {activeTab === "active" && (
              <ActiveTab key="active" ride={activeRide} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  badge,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  badge: number;
  color: "emerald" | "blue" | "amber";
}) {
  const colors = {
    emerald:
      "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 text-white shadow-md",
    blue: "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 text-white shadow-md",
    amber:
      "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-white shadow-md",
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-200 relative font-semibold tracking-wide ${
        active
          ? "bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-600 text-white shadow-lg border border-white/10"
          : "text-neutral-400 hover:text-neutral-200"
      }`}
    >
      <Icon className="w-6 h-6" />
      {badge > 0 && (
        <span
          className={`absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 ${colors[color]} rounded-full text-xs flex items-center justify-center font-bold border border-white/20 drop-shadow-lg`}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function AvailableTab({
  ride,
  isOnline,
  onOpenModal,
  compact,
}: {
  ride: Ride | null;
  isOnline: boolean;
  onOpenModal: () => void;
  compact?: boolean;
}) {
  if (!isOnline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center h-full py-8 text-neutral-500"
      >
        <Circle className="w-10 h-10 mb-2 text-neutral-700" />
        <p className="text-sm">Passez en ligne</p>
      </motion.div>
    );
  }

  if (!ride) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center h-full py-8 text-neutral-500"
      >
        <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse mb-2" />
        <p className="text-sm">En attente...</p>
      </motion.div>
    );
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onOpenModal}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {ride.pickupLocation}
            </p>
            <p className="text-emerald-400 text-xs">
              → {ride.dropoffLocation.slice(0, 30)}...
            </p>
          </div>
          <span className="text-emerald-400 font-bold">
            {formatPrice(ride.estimatedPrice || 0)}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 py-2"
    >
      <div
        onClick={onOpenModal}
        className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold text-sm">
              NOUVELLE COURSE
            </span>
          </div>
          <span className="text-2xl font-bold text-white">
            {formatPrice(ride.estimatedPrice || 0)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-neutral-300 truncate">
              {ride.pickupLocation}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-neutral-300 truncate">
              {ride.dropoffLocation}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-sm text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDuration(Math.round((ride.estimatedDuration || 0) / 60))}
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="w-4 h-4" />
            {formatDistance((ride.estimatedDistance || 0) / 1000)}
          </span>
        </div>

        <Button
          className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal();
          }}
        >
          VOIR DÉTAILS
        </Button>
      </div>
    </motion.div>
  );
}

function ScheduledTab({ rides }: { rides: Ride[] }) {
  if (rides.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center h-full py-8 text-neutral-500"
      >
        <Calendar className="w-10 h-10 mb-2 text-neutral-700" />
        <p className="text-sm">Aucune course planifiée</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 py-2"
    >
      {rides.map((ride) => (
        <div
          key={ride.id}
          className="bg-neutral-900 rounded-xl p-4 border border-white/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                {ride.pickupTime
                  ? new Date(ride.pickupTime).toLocaleString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Date non définie"}
              </span>
            </div>
            <span className="text-lg font-bold text-white">
              {formatPrice(ride.estimatedPrice || 0)}
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-neutral-300">
              <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="truncate">{ride.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <Navigation className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="truncate">{ride.dropoffLocation}</span>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function ActiveTab({ ride }: { ride: Ride | null }) {
  const { setActiveRide } = useDriverStore();
  const [navAppLabel, setNavAppLabel] = useState<string | null>(null);

  useEffect(() => {
    setNavAppLabel(
      getPreferredNavApp()
        ? NAV_APP_LABELS[getPreferredNavApp()!]
        : null,
    );
  }, []);

  if (!ride) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center h-full py-8 text-neutral-500"
      >
        <Play className="w-10 h-10 mb-2 text-neutral-700" />
        <p className="text-sm">Aucune course en cours</p>
      </motion.div>
    );
  }

  const hasArrived = Boolean(ride.driverArrivedAt);
  const isScheduled = ride.status === "scheduled";
  const isInProgress = ride.status === "in-progress";

  const navigatePickup = () => {
    void openExternalNavigation({
      lat: ride.pickupLat,
      lng: ride.pickupLng,
      address: ride.pickupLocation,
      label: "Prise en charge",
    });
    const app = getPreferredNavApp();
    setNavAppLabel(app ? NAV_APP_LABELS[app] : null);
  };

  const navigateDropoff = () => {
    void openExternalNavigation({
      lat: ride.dropoffLat,
      lng: ride.dropoffLng,
      address: ride.dropoffLocation,
      label: "Destination",
    });
  };

  const handleArrived = async () => {
    const result = await driverRideService.markDriverArrived(ride.id);
    if (!result.success) {
      window.alert(result.error || "Impossible de signaler l'arrivée");
      return;
    }
    setActiveRide({
      ...ride,
      driverArrivedAt: result.driverArrivedAt ?? new Date().toISOString(),
    });
  };

  const handleStart = async () => {
    const result = await driverRideService.updateRideProgress(
      ride.id,
      "in-progress",
    );
    if (!result.success) {
      window.alert(result.error || "Impossible de démarrer");
      return;
    }
    setActiveRide({ ...ride, status: "in-progress" });
    navigateDropoff();
  };

  const handleComplete = async () => {
    const result = await driverRideService.updateRideProgress(
      ride.id,
      "completed",
    );
    if (!result.success) {
      window.alert(result.error || "Impossible de terminer");
      return;
    }
    setActiveRide(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 py-2"
    >
      <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-amber-400 font-semibold text-sm">EN COURS</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-white">{ride.pickupLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-white">{ride.dropoffLocation}</span>
          </div>
        </div>

        {navAppLabel ? (
          <button
            type="button"
            className="w-full text-center text-xs text-neutral-500 mb-3 hover:text-neutral-300"
            onClick={() => {
              void changePreferredNavApp().then((app) => {
                setNavAppLabel(app ? NAV_APP_LABELS[app] : navAppLabel);
              });
            }}
          >
            GPS : {navAppLabel} · Changer
          </button>
        ) : null}

        {isScheduled && !hasArrived && (
          <div className="space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={navigatePickup}
            >
              Naviguer vers prise en charge
            </Button>
            <Button
              variant="outline"
              className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
              onClick={() => {
                void handleArrived();
              }}
            >
              Je suis arrivé
            </Button>
          </div>
        )}

        {isScheduled && hasArrived && (
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => {
              void handleStart();
            }}
          >
            Démarrer la course
          </Button>
        )}

        {isInProgress && (
          <div className="space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={navigateDropoff}
            >
              Naviguer vers destination
            </Button>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                void handleComplete();
              }}
            >
              Terminer la course
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
