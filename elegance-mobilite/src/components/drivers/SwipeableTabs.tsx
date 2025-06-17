'use client'

import { useState, useRef } from "react"
import { motion, AnimatePresence, PanInfo, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

interface TabItem {
  id: string
  label: string
  content: React.ReactNode
}

interface SwipeableTabsProps {
  tabs: TabItem[]
  defaultTab?: string
  className?: string
}

export function SwipeableTabs({ tabs, defaultTab, className }: SwipeableTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const [direction, setDirection] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)
  
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab)
  
  const changeTab = (newTabId: string) => {
    const newIndex = tabs.findIndex(tab => tab.id === newTabId)
    setDirection(newIndex > activeIndex ? 1 : -1)
    setActiveTab(newTabId)
  }

  // Navigation par swipe horizontal
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    const threshold = 50
    const velocity = info.velocity.x
    
    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 300) {
      if (info.offset.x > 0 && activeIndex > 0) {
        // Swipe vers la droite - tab précédent
        changeTab(tabs[activeIndex - 1].id)
      } else if (info.offset.x < 0 && activeIndex < tabs.length - 1) {
        // Swipe vers la gauche - tab suivant
        changeTab(tabs[activeIndex + 1].id)
      }
    }
    
    // Reset position
    x.set(0)
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }
  
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  }
  
  return (
    <div className={cn("w-full h-full", className)}>
      {/* Tab Headers - Style inspiré Uber/Bolt */}
      <div className="flex bg-neutral-800/50 backdrop-blur-sm rounded-xl p-1 mb-2 border border-neutral-700/30">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => changeTab(tab.id)}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 relative",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
              activeTab === tab.id
                ? "text-white"
                : "text-neutral-400 hover:text-neutral-200"
            )}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Indicateur actif animé */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {/* Texte du tab */}
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        ))}
      </div>
      {/* Indicateurs de swipe sous les tabs */}
      <div className="flex justify-center items-center mb-2">
        {tabs.map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full mx-1 transition-all duration-300",
              index === activeIndex ? "bg-white/60" : "bg-neutral-600/40"
            )}
            animate={{
              scale: index === activeIndex ? 1.2 : 1,
              opacity: index === activeIndex ? 1 : 0.5
            }}
          />
        ))}
      </div>
      {/* Tab Content avec swipe horizontal */}
      <div className="relative overflow-hidden flex-1">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="w-full h-full"
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {tabs.map((tab) => 
              tab.id === activeTab ? (
                <motion.div
                  key={tab.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 400, damping: 30 },
                    opacity: { duration: 0.15 },
                    scale: { duration: 0.2 }
                  }}
                  className="w-full h-full"
                  style={{
                    opacity: isDragging ? 0.8 : 1,
                    scale: isDragging ? 0.98 : 1
                  }}
                >
                  <div className="h-full overflow-y-auto pb-4">
                    {tab.content}
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
