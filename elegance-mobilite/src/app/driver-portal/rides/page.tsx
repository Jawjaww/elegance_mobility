'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function DriverRidesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/driver-portal/dashboard">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-white">Mes courses</h1>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Historique des courses
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Vos courses passées et à venir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-neutral-500">
            <p>Aucune course pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
