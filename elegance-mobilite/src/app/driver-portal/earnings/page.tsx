'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Wallet, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useDriverStore } from '@/lib/driver/store'

export default function DriverEarningsPage() {
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
        <h1 className="text-2xl font-bold text-white">Mes gains</h1>
      </motion.div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-none">
          <CardContent className="p-6 text-center">
            <p className="text-emerald-100 mb-2">Total gagné aujourd'hui</p>
            <motion.p 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-5xl font-bold text-white"
            >
              {stats.todayEarnings.toFixed(0)}€
            </motion.p>
            <p className="text-emerald-100 mt-2 text-sm">
              {stats.todayRides} courses effectuées
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Détails */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-300">Gain moyen par course</span>
              </div>
              <span className="text-white font-medium">
                {stats.todayRides > 0 ? (stats.todayEarnings / stats.todayRides).toFixed(0) : 0}€
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-300">Temps en ligne</span>
              </div>
              <span className="text-white font-medium">{stats.onlineTimeMinutes} min</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-300">Note moyenne</span>
              </div>
              <span className="text-white font-medium">
                {stats.rating > 0 ? stats.rating.toFixed(1) : '--'}/5
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Historique des paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-neutral-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun paiement à afficher</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
