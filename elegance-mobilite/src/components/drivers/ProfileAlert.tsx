'use client'

import { AlertTriangle, CheckCircle2, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProfileAlertProps {
  isProfileComplete: boolean
  missingFields?: string[]
  onCompleteProfile: () => void
}

export function ProfileAlert({ 
  isProfileComplete, 
  missingFields = [], 
  onCompleteProfile 
}: ProfileAlertProps) {
  if (isProfileComplete) {
    return (
      <Card className="border-green-800 bg-green-900/20">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <div className="flex-1">
            <p className="font-medium text-green-200">Profil complet</p>
            <p className="text-sm text-green-300">Vous pouvez accepter des courses</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-800 bg-amber-900/20">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        <div className="flex-1">
          <p className="font-medium text-amber-200">Profil incomplet</p>
          <p className="text-sm text-amber-300">
            Complétez votre profil pour accepter des courses
          </p>
          {missingFields.length > 0 && (
            <p className="text-xs text-amber-400 mt-1">
              Manque: {missingFields.join(', ')}
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
