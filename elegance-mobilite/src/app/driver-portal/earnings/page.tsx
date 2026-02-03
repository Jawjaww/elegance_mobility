'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, ChevronLeft, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function DriverEarningsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/driver-portal/dashboard">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-white">Mes revenus</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardDescription className="text-neutral-400">Aujourd'hui</CardDescription>
            <CardTitle className="text-2xl text-white">0 €</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardDescription className="text-neutral-400">Cette semaine</CardDescription>
            <CardTitle className="text-2xl text-white">0 €</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardDescription className="text-neutral-400">Ce mois</CardDescription>
            <CardTitle className="text-2xl text-white">0 €</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Historique des gains
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Détail de vos revenus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-neutral-500">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun revenu enregistré</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
