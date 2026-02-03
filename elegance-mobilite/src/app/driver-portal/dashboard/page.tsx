'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Clock, MapPin, Wallet, Star, Calendar } from "lucide-react"
import Link from "next/link"

export default function DriverDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
          <p className="text-neutral-400 mt-1">Bienvenue dans votre espace chauffeur</p>
        </div>
        <Link href="/driver-portal/rides/available">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Car className="w-4 h-4 mr-2" />
            Voir les courses disponibles
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-neutral-400">Courses aujourd'hui</CardDescription>
            <CardTitle className="text-2xl text-white">0</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-neutral-500">
              <Car className="w-4 h-4 mr-1" />
              En cours: 0
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-neutral-400">Revenus du jour</CardDescription>
            <CardTitle className="text-2xl text-white">0 €</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-emerald-500">
              <Wallet className="w-4 h-4 mr-1" />
              Cette semaine: 0 €
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-neutral-400">Note moyenne</CardDescription>
            <CardTitle className="text-2xl text-white">--</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-yellow-500">
              <Star className="w-4 h-4 mr-1" />
              Basé sur 0 avis
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-neutral-400">Temps de connexion</CardDescription>
            <CardTitle className="text-2xl text-white">--</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-neutral-500">
              <Clock className="w-4 h-4 mr-1" />
              Aujourd'hui
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Rides */}
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Prochaines courses
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Vos courses planifiées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-neutral-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune course planifiée</p>
              <Link href="/driver-portal/rides/available">
                <Button variant="outline" className="mt-4 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                  Chercher des courses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Actions rapides</CardTitle>
            <CardDescription className="text-neutral-400">
              Accès rapide aux fonctionnalités
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/driver-portal/rides">
              <Button variant="outline" className="w-full justify-start border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                <Car className="w-4 h-4 mr-2" />
                Mes courses
              </Button>
            </Link>
            <Link href="/driver-portal/earnings">
              <Button variant="outline" className="w-full justify-start border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                <Wallet className="w-4 h-4 mr-2" />
                Mes revenus
              </Button>
            </Link>
            <Link href="/driver-portal/schedule">
              <Button variant="outline" className="w-full justify-start border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                <Calendar className="w-4 h-4 mr-2" />
                Mon planning
              </Button>
            </Link>
            <Link href="/driver-portal/profile">
              <Button variant="outline" className="w-full justify-start border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                <Star className="w-4 h-4 mr-2" />
                Mon profil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Available Rides Alert */}
      <Card className="bg-gradient-to-r from-blue-950/50 to-neutral-900 border-blue-500/20">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Courses disponibles</h3>
            <p className="text-neutral-400">Consultez les courses en attente d'un chauffeur</p>
          </div>
          <Link href="/driver-portal/rides/available">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Voir les offres
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
