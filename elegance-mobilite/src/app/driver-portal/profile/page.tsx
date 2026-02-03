'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, ChevronLeft, Star, Phone, Mail, Car } from "lucide-react"
import Link from "next/link"

export default function DriverProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/driver-portal/dashboard">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-white">Mon profil</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-300">
              <User className="w-4 h-4 text-neutral-500" />
              <span>Chauffeur</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <Mail className="w-4 h-4 text-neutral-500" />
              <span>email@exemple.com</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <Phone className="w-4 h-4 text-neutral-500" />
              <span>+33 6 12 34 56 78</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Car className="w-5 h-5 mr-2" />
              Véhicule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 text-neutral-500">
              <p>Aucun véhicule enregistré</p>
              <Button variant="outline" className="mt-4 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                Ajouter un véhicule
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Évaluations
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Vos avis clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-neutral-500">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun avis pour le moment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
