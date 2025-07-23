'use client'

import { useState, useRef, useEffect } from "react"
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  children: React.ReactNode
  title?: string
  minHeight?: number
  maxHeight?: number
  defaultHeight?: number
  className?: string
}

export function BottomSheet({ 
  children, 
  title,
  minHeight = 120,
  maxHeight = window.innerHeight * 0.9, // 90% de la hauteur de l'écran, plus grand que avant
  defaultHeight = 300, // Hauteur par défaut augmentée pour montrer plus de contenu
  className
}: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentHeight, setCurrentHeight] = useState(defaultHeight)
  const [isDragging, setIsDragging] = useState(false)
  const y = useMotionValue(0)
  
  // États de hauteur possibles (comme Uber/Bolt) - ajout d'un état intermédiaire
  const snapPoints = [minHeight, defaultHeight, maxHeight * 0.6, maxHeight]
  
  // Animation de l'opacité du backdrop
  const backdropOpacity = useTransform(
    y, 
    [0, -maxHeight / 2], 
    [0, 0.2]
  )
  
  // Trouver le point de snap le plus proche
  const findNearestSnapPoint = (height: number) => {
    return snapPoints.reduce((prev, curr) => 
      Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
    )
  }
  
  // Gestion du swipe - améliorée pour plus de fluidité
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isDragging) setIsDragging(true)
    
    const screenHeight = window.innerHeight
    const dragY = info.point.y
    const newHeight = Math.max(minHeight, Math.min(maxHeight, screenHeight - dragY + 20))
    setCurrentHeight(newHeight)
  }
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    const velocity = info.velocity.y
    const newHeight = currentHeight
    
    // Logique de snap améliorée avec transitions plus intelligentes
    let targetHeight: number
    
    if (Math.abs(velocity) > 800) {
      // Geste rapide - comportement plus intuitif
      if (velocity > 0) {
        // Swipe rapide vers le bas = fermer à la hauteur minimum
        targetHeight = minHeight
      } else {
        // Swipe rapide vers le haut = ouvrir au maximum
        targetHeight = maxHeight
      }
    } else {
      // Geste lent - trouver le point de snap le plus proche
      targetHeight = findNearestSnapPoint(newHeight)
      
      // Amélioration: si on est à 75% vers le point suivant, y aller directement
      const currentIndex = snapPoints.indexOf(targetHeight)
      if (currentIndex < snapPoints.length - 1) {
        const nextPoint = snapPoints[currentIndex + 1]
        const threshold = targetHeight + (nextPoint - targetHeight) * 0.25
        if (newHeight > threshold) {
          targetHeight = nextPoint
        }
      }
    }
    
    // Mettre à jour la hauteur avec animation
    setCurrentHeight(targetHeight)
    setIsExpanded(targetHeight === maxHeight)
    
    // Sauvegarder la hauteur utilisateur (pour une meilleure UX)
    if (targetHeight !== minHeight && targetHeight !== maxHeight) {
      localStorage.setItem('preferredBottomSheetHeight', targetHeight.toString())
    }
  }
  
  const toggleSheet = () => {
    // Comportement plus intelligent pour le toggle
    let newHeight = defaultHeight
    
    // Si déjà en mode expanded, revenir à l'état moyen ou par défaut
    if (isExpanded) {
      newHeight = snapPoints[2] || defaultHeight
    } 
    // Sinon, passer en mode expanded
    else {
      newHeight = maxHeight
    }
    
    setCurrentHeight(newHeight)
    setIsExpanded(!isExpanded)
  }

  // Un simple tap sur la poignée pour expand/collapse
  const handleTap = () => {
    toggleSheet()
  }

  return (
    <>
      {/* Backdrop subtil */}
      <motion.div
        className="fixed inset-0 bg-black/20 pointer-events-none z-40"
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Bottom Sheet */}
      <motion.div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-neutral-900/95 border-t border-neutral-800/50 rounded-t-3xl shadow-2xl z-50",
          "backdrop-blur-xl",
          isDragging && "transition-none",
          className
        )}
        animate={{ 
          height: currentHeight,
          y: 0
        }}
        initial={{ height: defaultHeight }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 200,
          duration: isDragging ? 0 : 0.4
        }}
        style={{ 
          height: isDragging ? currentHeight : undefined,
          touchAction: 'none' // Empêche le scroll du navigateur
        }}
      >
        {/* Handle avec zone de drag élargie */}
        <motion.div
          className="flex flex-col items-center cursor-grab active:cursor-grabbing py-3 px-4 relative"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onTap={handleTap}
          whileTap={{ scale: 0.98 }}
        >
          {/* Indicateur visuel de drag */}
          <motion.div 
            className="w-12 h-1.5 bg-neutral-500 rounded-full mb-3"
            animate={{ 
              backgroundColor: isDragging ? "#737373" : "#6b7280",
              width: isDragging ? 48 : 40
            }}
            transition={{ duration: 0.2 }}
          />
          
          {title && (
            <div className="flex items-center gap-2 opacity-80">
              <h3 className="text-base font-medium text-white">{title}</h3>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              </motion.div>
            </div>
          )}
          
          {/* Zone de touch élargie pour le drag */}
          <div className="absolute inset-0 -top-2 -bottom-2" />
        </motion.div>
        
        {/* Content avec gestion du scroll intelligent */}
        <div 
          className="flex-1 overflow-hidden px-4 pb-safe"
          style={{ 
            height: `calc(${currentHeight}px - 80px)`,
            maxHeight: `calc(${maxHeight}px - 80px)`
          }}
        >
          <motion.div 
            className="h-full"
            animate={{ opacity: isDragging ? 0.7 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-full overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}
