'use client'

import { AlertTriangle, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useDriverProfileCompleteness } from "@/hooks/useDriverProfileCompleteness"

interface ProfileAlertProps {
  userId: string
  onCompleteProfile: () => void
}

export function ProfileAlert({ 
  userId,
  onCompleteProfile 
}: ProfileAlertProps) {
  const { data: completeness, isLoading } = useDriverProfileCompleteness(userId)
  
  // Ne rien afficher pendant le chargement pour éviter l'affichage prématuré
  if (isLoading || !completeness) {
    return null
  }
  
  if (completeness.is_complete) {
    return null // Ne rien afficher si le profil est complet
  }

  const missingFieldsLabels: Record<string, string> = {
    first_name: 'Prénom',
    phone: 'Téléphone', 
    company_name: 'Entreprise',
    company_phone: 'Tél. entreprise',
    driving_license_number: 'Permis',
    driving_license_expiry_date: 'Expiration permis',
    vtc_card_number: 'Carte VTC',
    vtc_card_expiry_date: 'Expiration VTC'
  }

  const missingLabels = completeness.missing_fields
    .map(field => missingFieldsLabels[field] || field)
    .slice(0, 3) // Limiter à 3 pour l'affichage
    .join(', ')

  return (
    <Card className="border-amber-800 bg-amber-900/20">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        <div className="flex-1">
          <p className="font-medium text-amber-200">
            Profil incomplet ({completeness.completion_percentage}%)
          </p>
          <p className="text-sm text-amber-300">
            Complétez votre profil pour accepter des courses
          </p>
          {completeness.missing_fields.length > 0 && (
            <p className="text-xs text-amber-400 mt-1">
              Manque: {missingLabels}{completeness.missing_fields.length > 3 ? '...' : ''}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-amber-900/30 border-amber-600 text-amber-200 hover:bg-amber-900/50"
          onClick={onCompleteProfile}
        >
          <User className="h-4 w-4 mr-2" />
          Compléter
        </Button>
      </CardContent>
    </Card>
  )
}
