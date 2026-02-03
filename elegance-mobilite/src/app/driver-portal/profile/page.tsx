'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  User, 
  Phone, 
  Mail, 
  Car, 
  Star,
  Edit,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/database/client'
import { useDriverStore } from '@/lib/driver/store'

export default function DriverProfilePage() {
  const router = useRouter()
  const { stats } = useDriverStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/driver-portal/login')
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-4 pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <Link href="/driver-portal/dashboard">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Mon profil</h1>
        </div>
        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
          <Edit className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Avatar et nom */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-3xl">
          👤
        </div>
        <h2 className="text-xl font-bold text-white">Chauffeur Elegance</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-neutral-300">
            {stats.rating > 0 ? stats.rating.toFixed(1) : 'Nouveau'}
          </span>
        </div>
      </motion.div>

      {/* Informations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-300">
              <User className="w-5 h-5 text-neutral-500" />
              <span>ID Chauffeur</span>
              <span className="ml-auto text-neutral-500 text-sm">--</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <Phone className="w-5 h-5 text-neutral-500" />
              <span>Téléphone</span>
              <span className="ml-auto text-neutral-500 text-sm">--</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <Mail className="w-5 h-5 text-neutral-500" />
              <span>Email</span>
              <span className="ml-auto text-neutral-500 text-sm">--</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-500" />
              Véhicule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-neutral-500">
              <p>Aucun véhicule enregistré</p>
              <Button variant="outline" className="mt-3 border-neutral-700 text-neutral-300">
                Ajouter un véhicule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Déconnexion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={handleLogout}
            variant="destructive" 
            className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
