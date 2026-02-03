'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Home, Car, Wallet, User } from "lucide-react"
import { useDriverStore } from "@/stores/driverStore"

const BOTTOM_NAV_ITEMS = [
  { name: "Accueil", href: "/driver-portal/dashboard", icon: Home },
  { name: "Courses", href: "/driver-portal/rides", icon: Car },
  { name: "Gains", href: "/driver-portal/earnings", icon: Wallet },
  { name: "Profil", href: "/driver-portal/profile", icon: User },
]

export function DriverHeader() {
  const pathname = usePathname() ?? ''
  const { isOnline } = useDriverStore()

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`)

  return (
    <>
      {/* Top Status Bar - Glassmorphism */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 pb-2">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-lg mx-auto"
        >
          <div className="bg-neutral-950/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg">
            {/* Logo */}
            <Link href="/driver-portal/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-white text-sm hidden sm:block">Elegance</span>
            </Link>

            {/* Status */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50" : "bg-neutral-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isOnline ? "text-green-400" : "text-neutral-400"
              )}>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Navigation - Modern floating dock */}
      <div className="fixed bottom-4 left-4 right-4 z-50">
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-sm mx-auto"
        >
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-2 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-around">
              {BOTTOM_NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link key={item.name} href={item.href} className="relative">
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                        active 
                          ? "bg-green-500/20 text-green-400" 
                          : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 transition-transform",
                        active && "scale-110"
                      )} />
                      <span className="text-[10px] font-medium">{item.name}</span>
                      
                      {/* Active indicator */}
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-1 w-1 h-1 bg-green-500 rounded-full"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  )
}
