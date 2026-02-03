'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, ChevronLeft, MapPin, Calendar, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useDriverStore } from '@/lib/driver/store'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DriverRidesPage() {
  const { stats } = useDriverStore()

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
        <h1 className="text-2xl font-bold text-white">Mes courses</h1>
      </motion.div>

      {/* Stats rapides */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4">
              <p className="text-neutral-400 text-sm">Aujourd'hui</p>
              <p className="text-2xl font-bold text-white">{stats.todayRides}</p>
              <p className="text-xs text-neutral-500">courses</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4">
              <p className="text-neutral-400 text-sm">Cette semaine</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.todayEarnings.toFixed(0)}€</p>
              <p className="text-xs text-neutral-500">gains</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Historique */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-500" />
              Historique des courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-neutral-500">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Car className="w-16 h-16 mx-auto mb-4 opacity-30" />
              </motion.div>
              <p>Aucune course pour le moment</p>
              <p className="text-sm mt-2">Passez en ligne pour recevoir des courses</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
