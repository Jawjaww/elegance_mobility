'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Calendar, Clock, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function DriverSchedulePage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-neutral-950 p-4 pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <Link href="/driver-portal/dashboard">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Planning</h1>
      </motion.div>

      {/* Calendrier simplifié */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, index) => (
                <motion.button
                  key={day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(index)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-colors ${
                    selectedDay === index
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <span className="text-xs">{day}</span>
                  <span className="text-lg font-bold">{15 + index}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Créneaux */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Mes créneaux
            </CardTitle>
            <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-neutral-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun créneau défini</p>
              <p className="text-sm mt-2">Ajoutez vos disponibilités pour recevoir plus de courses</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
