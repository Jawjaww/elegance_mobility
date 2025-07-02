"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"
import { AlertTriangle, CheckCircle, XCircle, Eye, User, Phone, Loader2 } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { Database } from "@/lib/types/database.types"
import { useDriversAdminSimple } from "@/hooks/useDriversAdminSimple"

type DriverRow = Database['public']['Tables']['drivers']['Row']
type DriverStatus = Database['public']['Enums']['driver_status']

interface DriverWithUser extends DriverRow {
  users?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
}

interface DriverValidationData {
  driver: DriverWithUser
  isComplete: boolean
  completionPercentage: number
  missingFields: string[]
}

export default function AdminChauffeursPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Utiliser le hook pour récupérer les vraies données Supabase
  const {
    drivers,
    loading,
    error,
    refetch,
    updateDriverStatus,
    pendingDrivers,
    activeDrivers,
    inactiveDrivers,
    incompleteDrivers,
    stats
  } = useDriversAdminSimple()

  const [validating, setValidating] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<DriverWithUser | null>(null)
  const [validationModal, setValidationModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // Configuration des statuts
  const statusConfig = {
    pending_validation: { 
      label: "En attente de validation", 
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: AlertTriangle 
    },
    active: { 
      label: "Actif", 
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle 
    },
    inactive: { 
      label: "Inactif", 
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: XCircle 
    },
    incomplete: { 
      label: "Profil incomplet", 
      color: "bg-red-100 text-red-800 border-red-200",
      icon: AlertTriangle 
    },
    suspended: { 
      label: "Suspendu", 
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle 
    },
    on_vacation: { 
      label: "En vacances", 
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: CheckCircle 
    }
  }

  // Valider un driver
  const handleValidateDriver = async (driverId: string, approved: boolean, reason?: string) => {
    try {
      setValidating(true)
      
      const newStatus: DriverStatus = approved ? 'active' : 'inactive'
      const result = await updateDriverStatus(driverId, newStatus)
      
      if (result.success) {
        toast({
          variant: approved ? "default" : "destructive",
          title: approved ? "Chauffeur validé" : "Chauffeur rejeté",
          description: approved 
            ? "Le chauffeur peut maintenant accepter des courses"
            : "Le chauffeur a été notifié du rejet"
        })
        
        setValidationModal(false)
        setSelectedDriver(null)
        setRejectionReason("")
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de valider le chauffeur"
      })
    } finally {
      setValidating(false)
    }
  }

  // Changer le statut d'un driver
  const changeDriverStatus = async (driverId: string, newStatus: DriverStatus) => {
    try {
      const result = await updateDriverStatus(driverId, newStatus)
      
      if (result.success) {
        toast({
          title: "Statut modifié",
          description: `Le statut du chauffeur a été mis à jour`
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le statut"
      })
    }
  }

  const DriverCard = ({ driverData }: { driverData: DriverValidationData }) => {
    const { driver, isComplete, completionPercentage, missingFields } = driverData
    const config = statusConfig[driver.status] || statusConfig.inactive
    const StatusIcon = config.icon

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={driver.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {(driver.first_name?.[0] || '') + (driver.last_name?.[0] || '') || 'CH'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {driver.first_name} {driver.last_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {driver.phone || "Téléphone non renseigné"}
                </CardDescription>
              </div>
            </div>
            <Badge className={`${config.color} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-gray-500">Entreprise</Label>
              <p className="font-medium">{driver.company_name || "Non renseigné"}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Profil complet</Label>
              <p className="font-medium">{completionPercentage}%</p>
            </div>
          </div>

          {/* Champs manquants */}
          {missingFields.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <Label className="text-xs text-red-700 font-medium">Champs manquants:</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {missingFields.map((field, index) => (
                  <Badge key={`${field}-${index}`} variant="destructive" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => router.push(`/backoffice-portal/chauffeurs/${driver.id}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir profil
            </Button>

            {driver.status === 'pending_validation' && isComplete && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedDriver(driver)
                  setValidationModal(true)
                }}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider
              </Button>
            )}

            {driver.status === 'active' && (
              <Select 
                onValueChange={(value) => changeDriverStatus(driver.id, value as DriverStatus)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Changer statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Désactiver</SelectItem>
                  <SelectItem value="suspended">Suspendre</SelectItem>
                  <SelectItem value="on_vacation">En vacances</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Chargement des chauffeurs...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch}>
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestion des chauffeurs</h1>
        <p className="text-gray-600 mt-2">
          Validez et gérez les profils des chauffeurs de la plateforme ({stats.total} chauffeurs)
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            En attente ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Actifs ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Inactifs ({stats.inactive})
          </TabsTrigger>
          <TabsTrigger value="incomplete" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Incomplets ({stats.incomplete})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingDrivers.map(driverData => (
              <DriverCard key={driverData.driver.id} driverData={driverData} />
            ))}
          </div>
          {pendingDrivers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun chauffeur en attente de validation
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeDrivers.map(driverData => (
              <DriverCard key={driverData.driver.id} driverData={driverData} />
            ))}
          </div>
          {activeDrivers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun chauffeur actif
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactiveDrivers.map(driverData => (
              <DriverCard key={driverData.driver.id} driverData={driverData} />
            ))}
          </div>
          {inactiveDrivers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun chauffeur inactif
            </div>
          )}
        </TabsContent>

        <TabsContent value="incomplete" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {incompleteDrivers.map(driverData => (
              <DriverCard key={driverData.driver.id} driverData={driverData} />
            ))}
          </div>
          {incompleteDrivers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun profil incomplet
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de validation */}
      <Dialog open={validationModal} onOpenChange={setValidationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validation du chauffeur</DialogTitle>
            <DialogDescription>
              Choisissez d'approuver ou de rejeter ce chauffeur
            </DialogDescription>
          </DialogHeader>
          
          {selectedDriver && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">
                  {selectedDriver.first_name} {selectedDriver.last_name}
                </h4>
                <p className="text-sm text-gray-600">{selectedDriver.company_name}</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="rejection-reason">Raison du rejet (optionnel)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Expliquez pourquoi le profil est rejeté..."
                  value={rejectionReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleValidateDriver(selectedDriver.id, false, rejectionReason)}
                  disabled={validating}
                  className="flex-1"
                >
                  {validating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Rejeter
                </Button>
                <Button
                  onClick={() => handleValidateDriver(selectedDriver.id, true)}
                  disabled={validating}
                  className="flex-1"
                >
                  {validating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approuver
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
          