"use client"

import { CardContent, CardHeader, Card } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function PendingValidation() {
  return (
    <div className="container max-w-lg mx-auto py-12">
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">
            Inscription en cours de validation
          </h1>
          <p className="text-neutral-400 text-center">
            Merci pour votre inscription !
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-300">
            Votre demande d'inscription en tant que chauffeur est en cours d'examen par notre équipe.
            Ce processus peut prendre 24 à 48 heures ouvrées.
          </p>
          <p className="text-sm text-neutral-300">
            Un email de confirmation vous sera envoyé dès que votre compte sera validé.
            Vous pourrez alors vous connecter à votre espace chauffeur.
          </p>
          <p className="text-sm text-neutral-300">
            Pour toute question, n'hésitez pas à contacter notre équipe support :
            <br />
            <a href="mailto:support@elegance-mobilite.com" className="text-blue-500 hover:text-blue-400">
              support@elegance-mobilite.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}