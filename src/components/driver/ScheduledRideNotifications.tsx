'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, MapPin, Navigation, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Ride } from '@/lib/driver/types'

interface ScheduledNotification {
  id: string
  ride: Ride
  type: 'upcoming' | 'soon' | 'now'
  dismissed: boolean
}

export function ScheduledRideNotifications() {
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([])

  // Simuler des notifications pour les courses planifiées
  // Dans la vraie app, ça viendrait d'une subscription Supabase
  useEffect(() => {
    // Exemple : vérifier toutes les minutes les courses planifiées
    const checkScheduledRides = () => {
      // TODO: Récupérer les vraies courses planifiées depuis Supabase
      // const { data } = await supabase.from('rides').select('*').eq('status', 'scheduled')...
    }

    const interval = setInterval(checkScheduledRides, 60000)
    return () => clearInterval(interval)
  }, [])

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const acceptScheduledRide = (notification: ScheduledNotification) => {
    // TODO: Accepter la course planifiée
    console.log('Accepting scheduled ride:', notification.ride.id)
    dismissNotification(notification.id)
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-40 space-y-3 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <ScheduledRideToast
            key={notification.id}
            notification={notification}
            onDismiss={() => dismissNotification(notification.id)}
            onAccept={() => acceptScheduledRide(notification)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ScheduledRideToast({
  notification,
  onDismiss,
  onAccept
}: {
  notification: ScheduledNotification
  onDismiss: () => void
  onAccept: () => void
}) {
  const { ride, type } = notification

  const typeConfig = {
    upcoming: {
      bg: 'bg-blue-500',
      title: 'Course planifiée',
      subtitle: 'Dans moins d\'une heure',
      icon: Calendar
    },
    soon: {
      bg: 'bg-amber-500',
      title: 'Course bientôt',
      subtitle: 'Dans 15 minutes',
      icon: Clock
    },
    now: {
      bg: 'bg-emerald-500',
      title: 'Course maintenant !',
      subtitle: 'Le client vous attend',
      icon: Bell
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header avec gradient */}
      <div className={`${config.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">{config.title}</span>
        </div>
        <button 
          onClick={onDismiss}
          className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-neutral-400 mb-3">{config.subtitle}</p>

        {/* Adresses */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-emerald-400 mt-0.5" />
            <span className="text-neutral-200 line-clamp-2">{ride.pickupLocation}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-400 mt-0.5" />
            <span className="text-neutral-200 line-clamp-2">{ride.dropoffLocation}</span>
          </div>
        </div>

        {/* Heure */}
        <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4">
          <Clock className="w-4 h-4" />
          <span>
            {ride.pickupTime ? new Date(ride.pickupTime).toLocaleString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Date non définie'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 border-white/10 hover:bg-white/5"
            onClick={onDismiss}
          >
            Ignorer
          </Button>
          <Button 
            size="sm"
            className={`flex-1 ${config.bg} hover:opacity-90 text-white`}
            onClick={onAccept}
          >
            Accepter
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Hook pour utiliser les notifications
export function useScheduledRideNotifications() {
  const [showNotification, setShowNotification] = useState(false)

  const notify = (ride: Ride, type: 'upcoming' | 'soon' | 'now' = 'upcoming') => {
    // Dispatch custom event pour afficher la notification
    window.dispatchEvent(new CustomEvent('scheduled-ride-notification', { 
      detail: { ride, type } 
    }))
  }

  return { notify }
}
