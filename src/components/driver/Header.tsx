"use client";

import { DollarSign, Wifi, Power, ChevronDown } from "lucide-react";
import { useDriverStore } from "@/lib/driver/store";
import { MobileNav } from "./MobileNav";
import { motion } from "framer-motion";

export function Header() {
  const { isOnline, setIsOnline, stats } = useDriverStore();

  return (
    <>
      {/* Navigation mobile */}
      <MobileNav />

      {/* Header - Style élégant et moderne */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-4 left-16 right-4 flex items-center justify-end gap-3 z-10"
      >
        {/* Bouton En ligne/Hors ligne - Capsule glass ultra moderne */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 pl-2 pr-5 py-2 rounded-full transition-all duration-300 active:scale-97 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 backdrop-blur-lg border border-white/10 shadow-xl hover:shadow-emerald-500/40 ${
            isOnline
              ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 text-white hover:bg-emerald-600"
              : "bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-600 text-white hover:bg-neutral-900"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-inner ${isOnline ? "bg-white/30" : "bg-neutral-700/80"}`}
          >
            {isOnline ? (
              <Wifi className="w-5 h-5 text-emerald-500" />
            ) : (
              <Power className="w-5 h-5 text-red-400" />
            )}
          </div>
          <span className="text-base font-semibold tracking-wide drop-shadow-sm">
            {isOnline ? "En ligne" : "Hors ligne"}
          </span>
          <div
            className={`w-2.5 h-2.5 rounded-full border border-white/30 ${isOnline ? "bg-white shadow-[0_0_8px_rgba(52,211,153,0.7)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]"}`}
          />
        </button>

        {/* Gains - Capsule glass sombre ultra élégante */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700/90 backdrop-blur-lg rounded-full px-5 py-2 flex items-center gap-3 border border-white/10 shadow-xl hover:shadow-white/20 transition-all duration-300">
          <span className="text-neutral-300 text-xs font-medium tracking-wide">
            Aujourd'hui
          </span>
          <span className="font-bold text-white text-lg drop-shadow-sm flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            {stats.todayEarnings.toFixed(0)} €
          </span>
        </div>
      </motion.div>
    </>
  );
}
