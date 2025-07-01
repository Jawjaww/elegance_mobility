"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/useToast"
import { supabase } from "@/lib/database/client"
import { 
  ArrowLeft, 
  Save, 
  Edit, 
  CheckCircle, 
  XCircle, 
  User, 
  Car, 
  FileText, 
  Calendar, 
  Phone, 
  MapPin, 
  Loader2,
  AlertTriangle,
  History,
  Star,
  TrendingUp
} from "lucide-react"
import type { Database } from "@/lib/types/database.types"

type DriverRow = Database['public']['Tables']['drivers']['Row']
type DriverStatus = Database['public']['Enums']['driver_status']
type CompletenessData = Database["public"]["Functions"]["check_driver_profile_completeness"]["Returns"][number]

interface DriverValidationData {
  driver: DriverRow
  isComplete: boolean
  completionPercentage: number
  missingFields: string[]
}

export default function DriverProfilePage() {
  const router = useRouter()
  const params = useParams()
  const driverId = params?.id as string
  
  const [driver, setDriver] = useState<DriverRow | null>(null)
  const [validationData, setValidationData] = useState<DriverValidationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [validationModal, setValidationModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  
  // États pour l'édition
  const [editedDriver, setEditedDriver] = useState<DriverRow | null>(null)
  
  const { toast } = useToast()

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
      icon: Calendar 
    }
  }

  // Charger les données du chauffeur
  const loadDriver = async () => {
    try {
      setLoading(true)
      
      // Vérifier que l'ID est un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(driverId)) {
        throw new Error("ID de chauffeur invalide. Veuillez utiliser un ID valide depuis la liste des chauffeurs.")
      }
      
      // 1. Récupérer le profil du chauffeur depuis la table 'drivers'
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single()

      if (driverError || !driverData) {
        throw new Error(driverError?.message || "Chauffeur introuvable.")
      }

      // 2. Récupérer les données de complétude du profil via la fonction RPC
      const { data, error: rpcError } = await supabase
        .rpc('check_driver_profile_completeness', { driver_user_id: driverData.user_id })
        .single()

      const completenessData = data as CompletenessData | null

      if (rpcError) {
        // Ne pas bloquer si la RPC échoue, mais avertir et utiliser des valeurs par défaut
        console.warn("Erreur RPC pour check_driver_profile_completeness, utilisation de valeurs par défaut.", rpcError)
      }

      const finalValidationData: DriverValidationData = {
        driver: driverData,
        isComplete: completenessData?.is_complete ?? false,
        completionPercentage: completenessData?.completion_percentage ?? 0,
        missingFields: completenessData?.missing_fields ?? ['Données de validation non disponibles']
      }

      // 3. Mettre à jour les états avec les vraies données
      setDriver(driverData)
      setEditedDriver({ ...driverData })
      setValidationData(finalValidationData)
      
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le profil du chauffeur"
      })
    } finally {
      setLoading(false)
    }
  }

  // Sauvegarder les modifications
  const saveChanges = async () => {
    if (!editedDriver) return
    
    try {
      setSaving(true)
      
      // Appel à Supabase pour sauvegarder les modifications
      const { error } = await supabase
        .from('drivers')
        .update(editedDriver)
        .eq('id', editedDriver.id)

      if (error) {
        throw error
      }

      // Mettre à jour l'état local après la sauvegarde
      setDriver(editedDriver)
      setEditing(false)
      
      toast({
        title: "Modifications sauvegardées",
        description: "Le profil du chauffeur a été mis à jour"
      })
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications"
      })
    } finally {
      setSaving(false)
    }
  }

  // Valider un driver
  const handleValidateDriver = async (approved: boolean, reason?: string) => {
    if (!driver) return
    
    try {
      setSaving(true)
      
      // Appel de la fonction RPC pour valider/rejeter le chauffeur
      const { error } = await supabase.rpc('validate_driver', {
        driver_id: driver.id,
        approved: approved,
        rejection_reason: reason
      })

      if (error) {
        throw error
      }
      
      toast({
        variant: approved ? "default" : "destructive",
        title: approved ? "Chauffeur validé" : "Chauffeur rejeté",
        description: approved 
          ? "Le chauffeur peut maintenant accepter des courses"
          : "Le chauffeur a été notifié du rejet"
      })
      
      await loadDriver() // Recharger les données pour refléter le nouveau statut
      setValidationModal(false)
      setRejectionReason("")
      
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de valider le chauffeur"
      })
    } finally {
      setSaving(false)
    }
  }

  // Annuler les modifications
  const cancelEditing = () => {
    setEditedDriver(driver ? { ...driver } : null)
    setEditing(false)
  }

  useEffect(() => {
    loadDriver()
  }, [driverId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!driver || !validationData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <div className="text-red-500">
            <XCircle className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Chauffeur introuvable</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            L'ID du chauffeur "{driverId}" n'est pas valide ou le chauffeur n'existe pas dans la base de données.
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/backoffice-portal/chauffeurs")} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
            <p className="text-sm text-gray-500">
              Utilisez le bouton "Voir profil" depuis la liste des chauffeurs
            </p>
          </div>
        </div>
      </div>
    )
  }

  const config = statusConfig[driver.status] || statusConfig.inactive
  const StatusIcon = config.icon

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/backoffice-portal/chauffeurs")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {driver.first_name} {driver.last_name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={`${config.color} flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </Badge>
              <span className="text-gray-500">
                Inscrit le {new Date(driver.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {driver.status === 'pending_validation' && validationData.isComplete && (
            <Button
              onClick={() => setValidationModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider
            </Button>
          )}
          
          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEditing}>
                Annuler
              </Button>
              <Button onClick={saveChanges} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Courses totales</p>
                <p className="text-2xl font-bold">{driver.total_rides || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Note moyenne</p>
                <p className="text-2xl font-bold">{driver.rating || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Profil complet</p>
                <p className="text-2xl font-bold">{validationData.completionPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dernière activité</p>
                <p className="text-sm font-medium">
                  {new Date(driver.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Champs manquants */}
      {validationData.missingFields.length > 0 && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Profil incomplet</CardTitle>
            <CardDescription className="text-red-600">
              Certains champs sont manquants pour valider ce chauffeur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {validationData.missingFields.map(field => (
                <Badge key={field} variant="destructive">
                  {field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu principal */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    {editing ? (
                      <Input
                        id="first_name"
                        value={editedDriver?.first_name || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, first_name: e.target.value } : null
                        )}
                      />
                    ) : (
                      <p className="font-medium">{driver.first_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    {editing ? (
                      <Input
                        id="last_name"
                        value={editedDriver?.last_name || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, last_name: e.target.value } : null
                        )}
                      />
                    ) : (
                      <p className="font-medium">{driver.last_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      value={editedDriver?.phone || ""}
                      onChange={(e) => setEditedDriver(prev => 
                        prev ? { ...prev, phone: e.target.value } : null
                      )}
                    />
                  ) : (
                    <p className="font-medium">{driver.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="languages">Langues parlées</Label>
                  {editing ? (
                    <Input
                      id="languages"
                      value={editedDriver?.languages_spoken?.join(", ") || ""}
                      onChange={(e) => setEditedDriver(prev => 
                        prev ? { 
                          ...prev, 
                          languages_spoken: e.target.value.split(",").map(s => s.trim()) 
                        } : null
                      )}
                      placeholder="Français, Anglais, ..."
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {driver.languages_spoken?.map(lang => (
                        <Badge key={lang} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="zones">Zones préférées</Label>
                  {editing ? (
                    <Input
                      id="zones"
                      value={editedDriver?.preferred_zones?.join(", ") || ""}
                      onChange={(e) => setEditedDriver(prev => 
                        prev ? { 
                          ...prev, 
                          preferred_zones: e.target.value.split(",").map(s => s.trim()) 
                        } : null
                      )}
                      placeholder="Paris, Banlieue, ..."
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {driver.preferred_zones?.map(zone => (
                        <Badge key={zone} variant="outline">{zone}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informations entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Informations entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Nom de l'entreprise</Label>
                  {editing ? (
                    <Input
                      id="company_name"
                      value={editedDriver?.company_name || ""}
                      onChange={(e) => setEditedDriver(prev => 
                        prev ? { ...prev, company_name: e.target.value } : null
                      )}
                    />
                  ) : (
                    <p className="font-medium">{driver.company_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="company_phone">Téléphone entreprise</Label>
                  {editing ? (
                    <Input
                      id="company_phone"
                      value={editedDriver?.company_phone || ""}
                      onChange={(e) => setEditedDriver(prev => 
                        prev ? { ...prev, company_phone: e.target.value } : null
                      )}
                    />
                  ) : (
                    <p className="font-medium">{driver.company_phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="employee_name">Nom de l'employé</Label>
                  {editing ? (
                    <Input
                      id="employee_name"
                      value={editedDriver?.employee_name || ""}
                      onChange={(e) => setEditedDriver(prev => 
                        prev ? { ...prev, employee_name: e.target.value } : null
                      )}
                    />
                  ) : (
                    <p className="font-medium">{driver.employee_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="employee_phone">Téléphone employé</Label>
                  {editing ? (
                    <Input
                      id="employee_phone"
                      value={editedDriver?.employee_phone || ""}
                      onChange={(e) => setEditedDriver(prev => 
                        prev ? { ...prev, employee_phone: e.target.value } : null
                      )}
                    />
                  ) : (
                    <p className="font-medium">{driver.employee_phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Documents */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents et licences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Carte VTC */}
                <div className="space-y-3">
                  <Label>Carte VTC</Label>
                  <div className="space-y-2">
                    {editing ? (
                      <>
                        <Input
                          placeholder="Numéro de carte VTC"
                          value={editedDriver?.vtc_card_number || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, vtc_card_number: e.target.value } : null
                          )}
                        />
                        <Input
                          type="date"
                          placeholder="Date d'expiration"
                          value={editedDriver?.vtc_card_expiry_date || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, vtc_card_expiry_date: e.target.value } : null
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{driver.vtc_card_number}</p>
                        <p className="text-sm text-gray-500">
                          Expire le: {driver.vtc_card_expiry_date}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Permis de conduire */}
                <div className="space-y-3">
                  <Label>Permis de conduire</Label>
                  <div className="space-y-2">
                    {editing ? (
                      <>
                        <Input
                          placeholder="Numéro de permis"
                          value={editedDriver?.driving_license_number || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, driving_license_number: e.target.value } : null
                          )}
                        />
                        <Input
                          type="date"
                          placeholder="Date d'expiration"
                          value={editedDriver?.driving_license_expiry_date || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, driving_license_expiry_date: e.target.value } : null
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{driver.driving_license_number}</p>
                        <p className="text-sm text-gray-500">
                          Expire le: {driver.driving_license_expiry_date}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Assurance */}
                <div className="space-y-3">
                  <Label>Assurance</Label>
                  <div className="space-y-2">
                    {editing ? (
                      <>
                        <Input
                          placeholder="Numéro d'assurance"
                          value={editedDriver?.insurance_number || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, insurance_number: e.target.value } : null
                          )}
                        />
                        <Input
                          type="date"
                          placeholder="Date d'expiration"
                          value={editedDriver?.insurance_expiry_date || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, insurance_expiry_date: e.target.value } : null
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{driver.insurance_number}</p>
                        <p className="text-sm text-gray-500">
                          Expire le: {driver.insurance_expiry_date}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Activité */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historique des courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Fonctionnalité en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statut du chauffeur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Statut actuel</Label>
                <div className="mt-2">
                  <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </Badge>
                </div>
              </div>

              {driver.status !== 'pending_validation' && (
                <div>
                  <Label htmlFor="status-change">Changer le statut</Label>
                  <Select onValueChange={(value: DriverStatus) => {
                    const updatedDriver = { ...driver, status: value }
                    setDriver(updatedDriver)
                    setEditedDriver(updatedDriver)
                  }}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionner un nouveau statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="suspended">Suspendu</SelectItem>
                      <SelectItem value="on_vacation">En vacances</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
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
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">
                {driver.first_name} {driver.last_name}
              </h4>
              <p className="text-sm text-gray-600">{driver.company_name}</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="rejection-reason">Raison du rejet (optionnel)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Expliquez pourquoi le profil est rejeté..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleValidateDriver(false, rejectionReason)}
                disabled={saving}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
              <Button
                onClick={() => handleValidateDriver(true)}
                disabled={saving}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
