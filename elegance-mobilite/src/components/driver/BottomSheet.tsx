'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  snapPoints?: number[] // Percentages of screen height
  initialSnap?: number
  header?: React.ReactNode
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  snapPoints = [20, 50, 85],
  initialSnap = 1,
  header
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap)
  const constraintsRef = useRef<HTMLDivElement>(null)
  
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 200], [1, 0.5])
  
  // Calculate snap positions in pixels
  const getSnapPosition = (index: number) => {
    if (typeof window === 'undefined') return 0
    const maxHeight = window.innerHeight * 0.85
    return maxHeight - (window.innerHeight * snapPoints[index] / 100)
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const velocity = info.velocity.y
    const offset = info.offset.y
    
    // Determine target snap based on velocity and position
    let targetSnap = currentSnap
    
    if (velocity > 500 || offset > 100) {
      // Dragging down - go to lower snap or close
      targetSnap = Math.max(0, currentSnap - 1)
    } else if (velocity < -500 || offset < -100) {
      // Dragging up - go to higher snap
      targetSnap = Math.min(snapPoints.length - 1, currentSnap + 1)
    }
    
    if (targetSnap === 0 && offset > 150) {
      onClose()
    } else {
      setCurrentSnap(targetSnap)
    }
  }

  // Animate to current snap
  useEffect(() => {
    if (isOpen) {
      y.set(getSnapPosition(currentSnap))
    } else {
      y.set(typeof window !== 'undefined' ? window.innerHeight : 500)
    }
  }, [currentSnap, isOpen, y])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity }}
            onClick={() => onClose()}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          
          {/* Sheet */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: typeof window !== 'undefined' ? window.innerHeight : 500 }}
            animate={{ y: getSnapPosition(currentSnap) }}
            exit={{ y: typeof window !== 'undefined' ? window.innerHeight : 500 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: typeof window !== 'undefined' ? window.innerHeight * 0.85 : 500 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className="fixed left-0 right-0 bottom-0 z-50 bg-neutral-950 rounded-t-[2rem] shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
            </div>
            
            {/* Header */}
            {header && (
              <div className="px-6 pb-4">
                {header}
              </div>
            )}
            
            {/* Content */}
            <div className="px-6 pb-8 overflow-y-auto max-h-[70vh]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Simpler variant for ride requests
export function RideBottomSheet({
  isOpen,
  children,
}: {
  isOpen: boolean
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed left-0 right-0 bottom-0 z-50 bg-neutral-950 rounded-t-[2.5rem] shadow-2xl border-t border-white/10"
        >
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
          </div>
          
          {/* Content */}
          <div className="max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
