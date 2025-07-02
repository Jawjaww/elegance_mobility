"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/database/client"
import { useToast } from "@/hooks/useToast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  Edit,
  Save,
  Loader2,
  User,
  Car,
  FileText,
  History,
  Settings,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Clock,
  Camera
} from "lucide-react"
import { FileUpload, AvatarUpload, DocumentUpload } from "@/components/FileUpload"
import type { Database } from "@/lib/types/database.types"

type DriverRow = Database['public']['Tables']['drivers']['Row']
type DriverStatus = Database['public']['Enums']['driver_status']

interface DriverValidationData {
  driver: DriverRow
  isComplete: boolean
  completionPercentage: number
  missingFields: string[]
}

export default function DriverProfilePageModern() {
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

  // Configuration moderne des statuts
  const statusConfig = {
    pending_validation: { 
      label: "En attente", 
      color: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200",
      icon: AlertTriangle,
      gradient: "from-orange-400 to-amber-400"
    },
    active: { 
      label: "Actif", 
      color: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200",
      icon: CheckCircle,
      gradient: "from-green-400 to-emerald-400"
    },
    inactive: { 
      label: "Inactif", 
      color: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200",
      icon: XCircle,
      gradient: "from-gray-400 to-slate-400"
    },
    incomplete: { 
      label: "Incomplet", 
      color: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200",
      icon: AlertTriangle,
      gradient: "from-red-400 to-rose-400"
    },
    suspended: { 
      label: "Suspendu", 
      color: "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200",
      icon: XCircle,
      gradient: "from-red-400 to-pink-400"
    },
    on_vacation: { 
      label: "En vacances", 
      color: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200",
      icon: Calendar,
      gradient: "from-blue-400 to-cyan-400"
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
      
      // Récupérer le profil du chauffeur
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single()

      if (driverError || !driverData) {
        throw new Error(driverError?.message || "Chauffeur introuvable.")
      }

      // Calcul simple de la complétude (10 champs essentiels)
      const requiredFields = [
        'first_name', 'last_name', 'phone', 'company_name', 
        'address_line1', 'vtc_card_number', 'driving_license_number', 
        'insurance_number', 'avatar_url'
      ]
      const missingFields = requiredFields.filter(field => {
        const value = driverData[field as keyof typeof driverData]
        return !value || value === ''
      })
      
      // Vérifier au moins un véhicule
      const { data: vehicles } = await supabase
        .from('driver_vehicles')
        .select('id')
        .eq('driver_id', driverId)
        .limit(1)
      
      if (!vehicles || vehicles.length === 0) {
        missingFields.push('vehicle')
      }

      const completionPercentage = Math.round(
        ((10 - missingFields.length) / 10) * 100
      )

      const finalValidationData: DriverValidationData = {
        driver: driverData,
        isComplete: missingFields.length === 0,
        completionPercentage,
        missingFields: missingFields.map(field => {
          const fieldLabels: { [key: string]: string } = {
            'first_name': 'Prénom',
            'last_name': 'Nom',
            'phone': 'Téléphone',
            'company_name': 'Nom entreprise',
            'address_line1': 'Adresse',
            'vtc_card_number': 'Carte VTC',
            'driving_license_number': 'Permis de conduire',
            'insurance_number': 'Assurance',
            'avatar_url': 'Photo de profil',
            'vehicle': 'Véhicule'
          }
          return fieldLabels[field] || field
        })
      }

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
      
      const { error } = await supabase
        .from('drivers')
        .update(editedDriver)
        .eq('id', editedDriver.id)

      if (error) throw error

      setDriver(editedDriver)
      setEditing(false)
      
      toast({
        title: "✅ Modifications sauvegardées",
        description: "Le profil du chauffeur a été mis à jour"
      })
      
      // Recharger pour recalculer la complétude
      await loadDriver()
      
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
      
      const newStatus: DriverStatus = approved ? 'active' : 'inactive'
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', driver.id)

      if (error) throw error
      
      toast({
        variant: approved ? "default" : "destructive",
        title: approved ? "🎉 Chauffeur validé" : "❌ Chauffeur rejeté",
        description: approved 
          ? "Le chauffeur peut maintenant accepter des courses"
          : "Le chauffeur a été notifié du rejet"
      })
      
      await loadDriver()
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

  const cancelEditing = () => {
    setEditedDriver(driver ? { ...driver } : null)
    setEditing(false)
  }

  useEffect(() => {
    loadDriver()
  }, [driverId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200 animate-pulse"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Chargement du profil...</p>
          <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!driver || !validationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            <XCircle className="w-20 h-20 mx-auto text-red-500" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-red-200 animate-ping"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Chauffeur introuvable</h2>
            <p className="text-gray-600">
              L'ID "{driverId}" n'est pas valide ou le chauffeur n'existe pas.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push("/backoffice-portal/chauffeurs")} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Mobile-First */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/backoffice-portal/chauffeurs")}
              className="md:flex hidden"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            
            {/* Mobile Back Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/backoffice-portal/chauffeurs")}
              className="md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 text-center md:text-left md:ml-4">
              <h1 className="text-xl md:text-2xl font-bold truncate">
                {driver.first_name} {driver.last_name}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </Badge>
                <span className="text-sm text-gray-500 hidden md:inline">
                  Inscrit le {new Date(driver.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions Header */}
            <div className="flex items-center gap-2">
              {driver.status === 'pending_validation' && validationData.isComplete && (
                <Button
                  onClick={() => setValidationModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hidden md:flex"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider
                </Button>
              )}
              
              {editing ? (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={cancelEditing}>
                    <XCircle className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Annuler</span>
                  </Button>
                  <Button size="sm" onClick={saveChanges} disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 md:mr-2" />
                    )}
                    <span className="hidden md:inline">Sauvegarder</span>
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Modifier</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Header Card */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar Section */}
              <div className="relative">
                {editing ? (
                  <AvatarUpload
                    driverId={driverId}
                    currentAvatarUrl={driver.avatar_url}
                    onUploadComplete={(url) => {
                      setEditedDriver(prev => prev ? { ...prev, avatar_url: url } : null)
                      toast({
                        title: "✅ Photo mise à jour",
                        description: "Votre photo de profil a été modifiée"
                      })
                    }}
                  />
                ) : (
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-4 ring-white shadow-xl">
                    <AvatarImage src={driver.avatar_url || undefined} />
                    <AvatarFallback className={`text-2xl font-bold bg-gradient-to-br ${config.gradient} text-white`}>
                      {driver.first_name?.[0]}{driver.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {driver.first_name} {driver.last_name}
                  </h2>
                  <p className="text-lg text-gray-600">{driver.company_name}</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <TrendingUp className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                    <p className="text-sm text-gray-600">Courses</p>
                    <p className="text-xl font-bold">{driver.total_rides || 0}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <Star className="w-5 h-5 mx-auto text-yellow-600 mb-1" />
                    <p className="text-sm text-gray-600">Note</p>
                    <p className="text-xl font-bold">{driver.rating || "N/A"}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <CheckCircle className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-sm text-gray-600">Complétude</p>
                    <p className="text-xl font-bold">{validationData.completionPercentage}%</p>
                  </div>
                  
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <Clock className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                    <p className="text-sm text-gray-600">Statut</p>
                    <p className="text-sm font-medium">{config.label}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profil complété</span>
                    <span className="font-medium">{validationData.completionPercentage}%</span>
                  </div>
                  <Progress 
                    value={validationData.completionPercentage} 
                    className="h-3"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missing Fields Alert */}
        {validationData.missingFields.length > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-rose-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Profil incomplet
              </CardTitle>
              <CardDescription className="text-red-600">
                Certains champs sont manquants pour valider ce chauffeur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {validationData.missingFields.map((field, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs - Mobile Optimized */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/60 backdrop-blur">
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs md:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1 text-xs md:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1 text-xs md:text-sm">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Activité</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs md:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Profil */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-blue-600" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-medium">Prénom</Label>
                      {editing ? (
                        <Input
                          id="first_name"
                          value={editedDriver?.first_name || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, first_name: e.target.value } : null
                          )}
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">{driver.first_name}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-medium">Nom</Label>
                      {editing ? (
                        <Input
                          id="last_name"
                          value={editedDriver?.last_name || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, last_name: e.target.value } : null
                          )}
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">{driver.last_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Téléphone</Label>
                    {editing ? (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="phone"
                          value={editedDriver?.phone || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, phone: e.target.value } : null
                          )}
                          className="pl-10 transition-all focus:ring-2 focus:ring-blue-500"
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="font-medium text-gray-900">{driver.phone}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-sm font-medium">Date de naissance</Label>
                    {editing ? (
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={editedDriver?.date_of_birth || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, date_of_birth: e.target.value } : null
                        )}
                        className="transition-all focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="font-medium text-gray-900">
                          {driver.date_of_birth ? new Date(driver.date_of_birth).toLocaleDateString() : "Non renseigné"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    Adresse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_line1" className="text-sm font-medium">Adresse</Label>
                    {editing ? (
                      <Input
                        id="address_line1"
                        value={editedDriver?.address_line1 || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, address_line1: e.target.value } : null
                        )}
                        className="transition-all focus:ring-2 focus:ring-purple-500"
                        placeholder="123 rue de la République"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{driver.address_line1 || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">Ville</Label>
                      {editing ? (
                        <Input
                          id="city"
                          value={editedDriver?.city || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, city: e.target.value } : null
                          )}
                          className="transition-all focus:ring-2 focus:ring-purple-500"
                          placeholder="Paris"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">{driver.city || "Non renseigné"}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code" className="text-sm font-medium">Code postal</Label>
                      {editing ? (
                        <Input
                          id="postal_code"
                          value={editedDriver?.postal_code || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, postal_code: e.target.value } : null
                          )}
                          className="transition-all focus:ring-2 focus:ring-purple-500"
                          placeholder="75001"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">{driver.postal_code || "Non renseigné"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact d'urgence */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-red-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Contact d'urgence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name" className="text-sm font-medium">Nom du contact</Label>
                    {editing ? (
                      <Input
                        id="emergency_contact_name"
                        value={editedDriver?.emergency_contact_name || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, emergency_contact_name: e.target.value } : null
                        )}
                        className="transition-all focus:ring-2 focus:ring-red-500"
                        placeholder="Marie Dupont"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{driver.emergency_contact_name || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone" className="text-sm font-medium">Téléphone d'urgence</Label>
                    {editing ? (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="emergency_contact_phone"
                          value={editedDriver?.emergency_contact_phone || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, emergency_contact_phone: e.target.value } : null
                          )}
                          className="pl-10 transition-all focus:ring-2 focus:ring-red-500"
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="font-medium text-gray-900">{driver.emergency_contact_phone || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Documents */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Documents obligatoires */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Documents obligatoires
                  </CardTitle>
                  <CardDescription>
                    Ces documents sont requis pour la validation du profil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Carte VTC */}
                  <DocumentUpload
                    driverId={driverId}
                    documentType="vtc_card"
                    label="Carte VTC"
                    currentUrl={(driver.document_urls as any)?.vtc_card}
                    onUploadComplete={(url) => {
                      toast({
                        title: "✅ Document VTC uploadé",
                        description: "Le document a été enregistré avec succès"
                      })
                      loadDriver()
                    }}
                  />

                  {/* Permis de conduire */}
                  <DocumentUpload
                    driverId={driverId}
                    documentType="driving_license"
                    label="Permis de conduire"
                    currentUrl={(driver.document_urls as any)?.driving_license}
                    onUploadComplete={(url) => {
                      toast({
                        title: "✅ Permis uploadé",
                        description: "Le document a été enregistré avec succès"
                      })
                      loadDriver()
                    }}
                  />

                  {/* Assurance */}
                  <DocumentUpload
                    driverId={driverId}
                    documentType="insurance"
                    label="Assurance"
                    currentUrl={(driver.document_urls as any)?.insurance}
                    onUploadComplete={(url) => {
                      toast({
                        title: "✅ Assurance uploadée",
                        description: "Le document a été enregistré avec succès"
                      })
                      loadDriver()
                    }}
                  />
                </CardContent>
              </Card>

              {/* Documents optionnels */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-green-600" />
                    Documents optionnels
                  </CardTitle>
                  <CardDescription>
                    Documents supplémentaires pour un profil complet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DocumentUpload
                    driverId={driverId}
                    documentType="medical_certificate"
                    label="Certificat médical"
                    currentUrl={(driver.document_urls as any)?.medical_certificate}
                    onUploadComplete={(url) => {
                      toast({
                        title: "✅ Certificat médical uploadé",
                        description: "Le document a été enregistré avec succès"
                      })
                      loadDriver()
                    }}
                  />

                  <DocumentUpload
                    driverId={driverId}
                    documentType="tax_certificate"
                    label="Attestation fiscale"
                    currentUrl={(driver.document_urls as any)?.tax_certificate}
                    onUploadComplete={(url) => {
                      toast({
                        title: "✅ Attestation fiscale uploadée",
                        description: "Le document a été enregistré avec succès"
                      })
                      loadDriver()
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Activité */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  Fonctionnalité en cours de développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  Paramètres du compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  Fonctionnalité en cours de développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Validation Button */}
      {driver.status === 'pending_validation' && validationData.isComplete && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <Button
            onClick={() => setValidationModal(true)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-2xl"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Valider ce chauffeur
          </Button>
        </div>
      )}

      {/* Modal de validation */}
      <Dialog open={validationModal} onOpenChange={setValidationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validation du chauffeur</DialogTitle>
            <DialogDescription>
              Voulez-vous valider ou rejeter ce chauffeur ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Profil complet ✅</h4>
              <p className="text-sm text-green-700">
                Tous les champs requis sont renseignés ({validationData.completionPercentage}%)
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleValidateDriver(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Valider
              </Button>
              
              <Button
                onClick={() => handleValidateDriver(false, rejectionReason)}
                variant="destructive"
                className="flex-1"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Rejeter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
