'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SheetProps {
  children: React.ReactNode
  open: boolean
  onClose?: () => void
  title?: string
}

/**
 * Sheet bottom simplifié
 * Une seule variante, pas de drag complexe
 */
export function Sheet({ children, open, onClose, title }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 right-0 bottom-0 z-50 bg-neutral-950 rounded-t-[2rem] shadow-2xl border-t border-white/10 max-h-[85vh]"
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-4 pb-2 px-6">
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
            </div>
            
            {/* Header optionnel */}
            {(title || onClose) && (
              <div className="flex items-center justify-between px-6 pb-4">
                {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="px-6 pb-8 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
