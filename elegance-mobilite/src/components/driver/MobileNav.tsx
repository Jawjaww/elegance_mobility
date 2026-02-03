'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Car, 
  Wallet, 
  User, 
  Calendar,
  LogOut,
  X,
  Menu
} from 'lucide-react'
import { supabase } from '@/lib/database/client'

const NAV_ITEMS = [
  { name: 'Accueil', href: '/driver-portal/dashboard', icon: Home },
  { name: 'Courses', href: '/driver-portal/rides', icon: Car },
  { name: 'Gains', href: '/driver-portal/earnings', icon: Wallet },
  { name: 'Planning', href: '/driver-portal/schedule', icon: Calendar },
  { name: 'Profil', href: '/driver-portal/profile', icon: User },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/driver-portal/login')
  }

  return (
    <>
      {/* Bouton menu */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.95 }}
        className="fixed top-4 left-4 z-40 w-11 h-11 bg-neutral-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/10"
      >
        <Menu className="w-5 h-5 text-white" />
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-neutral-950 z-50 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">E</span>
                  </div>
                  <span className="font-bold text-white">Elegance</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-neutral-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Navigation */}
              <nav className="p-4 space-y-2">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  
                  return (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"
                        />
                      )}
                    </motion.a>
                  )
                })}
              </nav>

              {/* Déconnexion */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Se déconnecter</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
