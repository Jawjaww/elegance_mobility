"use client"

import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from "react"
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
  FileText,
  History,
  Settings,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  Clock
} from "lucide-react"
import type { Database } from "@/lib/types/database.types"

// Lazy loading des composants lourds
const AvatarUpload = lazy(() => import("@/components/FileUpload").then(module => ({ default: module.AvatarUpload })))
const DocumentUpload = lazy(() => import("@/components/FileUpload").then(module => ({ default: module.DocumentUpload })))

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

  // Configuration moderne des statuts - Memoized pour éviter les re-renders
  const statusConfig = useMemo(() => ({
    pending_validation: { 
      label: "En attente", 
      color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      icon: AlertTriangle,
      gradient: "from-orange-500 to-orange-600"
    },
    active: { 
      label: "Actif", 
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      icon: CheckCircle,
      gradient: "from-green-400 to-emerald-400"
    },
    inactive: { 
      label: "Inactif", 
      color: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
      icon: XCircle,
      gradient: "from-gray-400 to-slate-400"
    },
    incomplete: { 
      label: "Incomplet", 
      color: "bg-red-500/20 text-red-300 border-red-500/30",
      icon: AlertTriangle,
      gradient: "from-red-400 to-rose-400"
    },
    suspended: { 
      label: "Suspendu", 
      color: "bg-red-500/20 text-red-300 border-red-500/30",
      icon: XCircle,
      gradient: "from-red-400 to-pink-400"
    },
    on_vacation: { 
      label: "En vacances", 
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      icon: Calendar,
      gradient: "from-blue-400 to-cyan-400"
    }
  }), [])

  // Optimisation de la validation des champs - Utilise maintenant la fonction SQL
  const validateDriverProfile = useCallback(async (driverData: DriverRow) => {
    try {
      // Utiliser la fonction SQL qui vérifie TOUS les critères (16 champs)
      const { data: validationResult, error } = await supabase
        .rpc('check_driver_profile_completeness', { driver_user_id: driverData.user_id })
      
      if (error) {
        console.error('Erreur validation SQL:', error)
        // Fallback vers validation locale simplifiée
        return validateDriverProfileLocal(driverData)
      }

      if (validationResult && validationResult.length > 0) {
        const result = validationResult[0]
        return {
          missingFields: result.missing_fields || [],
          completionPercentage: result.completion_percentage || 0,
          isComplete: result.is_complete || false
        }
      }
      
      // Fallback si pas de résultat
      return validateDriverProfileLocal(driverData)
      
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
      return validateDriverProfileLocal(driverData)
    }
  }, [])

  // Validation locale simplifiée en fallback
  const validateDriverProfileLocal = useCallback((driverData: DriverRow) => {
    const requiredFields = [
      'first_name', 'last_name', 'phone', 'company_name', 
      'address_line1', 'vtc_card_number', 'driving_license_number', 
      'insurance_number', 'avatar_url'
    ]
    
    const missingFields = requiredFields.filter(field => {
      const value = driverData[field as keyof typeof driverData]
      return !value || value === ''
    })

    const completionPercentage = Math.round(((9 - missingFields.length) / 9) * 100)
    
    return {
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
          'avatar_url': 'Photo de profil'
        }
        return fieldLabels[field] || field
      }),
      completionPercentage,
      isComplete: missingFields.length === 0
    }
  }, [])

  // Charger les données du chauffeur - Optimisé
  const loadDriver = useCallback(async () => {
    try {
      setLoading(true)
      
      // Vérification UUID plus rapide
      if (!driverId || driverId.length !== 36) {
        throw new Error("ID de chauffeur invalide")
      }
      
      // Une seule requête optimisée
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single()

      if (driverError || !driverData) {
        throw new Error("Chauffeur introuvable")
      }

      // Validation avec la fonction SQL complète
      const validation = await validateDriverProfile(driverData)

      const finalValidationData: DriverValidationData = {
        driver: driverData,
        isComplete: validation.isComplete,
        completionPercentage: validation.completionPercentage,
        missingFields: validation.missingFields
      }

      setDriver(driverData)
      setEditedDriver({ ...driverData })
      setValidationData(finalValidationData)
      
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le profil"
      })
    } finally {
      setLoading(false)
    }
  }, [driverId, validateDriverProfile, toast])

  // Sauvegarder les modifications - Optimisé
  const saveChanges = useCallback(async () => {
    if (!editedDriver) return
    
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('drivers')
        .update(editedDriver)
        .eq('id', editedDriver.id)

      if (error) throw error

      // Forcer la mise à jour du statut côté Supabase après modification
      const { error: statusError } = await supabase
        .rpc('force_update_driver_status', { driver_user_id: editedDriver.user_id })
      
      if (statusError) {
        console.warn('Erreur mise à jour statut:', statusError)
      }

      // Recharger les données depuis la DB pour avoir le statut correct
      const { data: updatedDriver, error: reloadError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', editedDriver.id)
        .single()

      if (!reloadError && updatedDriver) {
        setDriver(updatedDriver)
        setEditedDriver({ ...updatedDriver })
        
        // Recalcul de la validation avec la fonction SQL
        const validation = await validateDriverProfile(updatedDriver)
        setValidationData(prev => prev ? {
          ...prev,
          ...validation,
          driver: updatedDriver
        } : null)
      } else {
        // Fallback si le rechargement échoue
        setDriver(editedDriver)
      }

      setEditing(false)
      
      toast({
        title: "✅ Sauvegardé",
        description: "Profil mis à jour"
      })
      
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Sauvegarde échouée"
      })
    } finally {
      setSaving(false)
    }
  }, [editedDriver, toast, validateDriverProfile])

  // Annuler l'édition
  const cancelEditing = useCallback(() => {
    setEditedDriver(driver ? { ...driver } : null)
    setEditing(false)
  }, [driver])

  // Valider un driver - Optimisé
  const handleValidateDriver = useCallback(async (approved: boolean, reason?: string) => {
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
        title: approved ? "🎉 Validé" : "❌ Rejeté",
        description: approved ? "Chauffeur activé" : "Chauffeur rejeté"
      })
      
      // Mise à jour locale rapide
      setDriver(prev => prev ? { ...prev, status: newStatus } : null)
      setValidationModal(false)
      setRejectionReason("")
      
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Validation échouée"
      })
    } finally {
      setSaving(false)
    }
  }, [driver, toast])

  // Callback pour recalculer la validation après upload de document
  const handleDocumentUpload = useCallback(async (documentType: string) => {
    if (!driver) return
    
    // Recharger les données du driver depuis la DB
    try {
      // Forcer la mise à jour du statut côté Supabase AVANT de recharger
      const { error: statusError } = await supabase
        .rpc('force_update_driver_status', { driver_user_id: driver.user_id })
      
      if (statusError) {
        console.warn('Erreur mise à jour statut:', statusError)
      }

      const { data: updatedDriver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driver.id)
        .single()

      if (!error && updatedDriver) {
        setDriver(updatedDriver)
        setEditedDriver({ ...updatedDriver })
        
        // Recalculer la validation avec les nouveaux données
        const validation = await validateDriverProfile(updatedDriver)
        setValidationData(prev => prev ? {
          ...prev,
          ...validation,
          driver: updatedDriver
        } : null)
        
        toast({
          title: "✅ Document uploadé",
          description: "Validation du profil mise à jour"
        })
      }
    } catch (error) {
      console.error('Erreur lors du rechargement:', error)
    }
  }, [driver, validateDriverProfile, toast])

  useEffect(() => {
    if (driverId) {
      loadDriver()
    }
  }, [driverId, loadDriver])

  // Calculs memoized pour éviter les re-renders
  const config = useMemo(() => {
    // Si le statut est en attente mais que le profil est incomplet, 
    // afficher "Incomplet" au lieu de "En attente"
    let effectiveStatus = driver?.status || 'inactive'
    
    if (effectiveStatus === 'pending_validation' && validationData && !validationData.isComplete) {
      effectiveStatus = 'incomplete'
    }
    
    return statusConfig[effectiveStatus]
  }, [driver?.status, validationData?.isComplete, statusConfig])
  
  const StatusIcon = config.icon

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-neutral-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!driver || !validationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
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
            <p className="text-sm text-neutral-400">
              Utilisez le bouton "Voir profil" depuis la liste des chauffeurs
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header Mobile-First */}
      <div className="sticky top-12 z-50 bg-neutral-900/95 backdrop-blur-md border-b rounded-lg border-neutral-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Single Back Button - Works for both mobile and desktop */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/backoffice-portal/chauffeurs")}
              className="text-neutral-100 hover:bg-neutral-800 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Driver Info - Responsive */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate text-neutral-100">
                {driver.first_name} {driver.last_name}
              </h1>
              <p className="text-xs text-neutral-400 truncate">
                <span className="hidden sm:inline">Inscrit le </span>
                {new Date(driver.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Actions - Responsive */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Validation Button - Desktop only in header */}
              {driver.status === 'pending_validation' && validationData?.isComplete && (
                <Button
                  onClick={() => setValidationModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hidden lg:flex"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="hidden xl:inline">Valider</span>
                </Button>
              )}
              
              {/* Edit/Save Actions */}
              {editing ? (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={cancelEditing} className="border-neutral-600 text-neutral-100 hover:bg-neutral-800">
                    <XCircle className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Annuler</span>
                  </Button>
                  <Button size="sm" onClick={saveChanges} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline ml-1">Sauvegarder</span>
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="border-neutral-600 text-neutral-100 hover:bg-neutral-800">
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Modifier</span>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile-only Quick Actions Bar */}
          {driver.status === 'pending_validation' && validationData?.isComplete && (
            <div className="lg:hidden mt-3 pt-3 border-t border-neutral-700">
              <Button
                onClick={() => setValidationModal(true)}
                size="sm"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider ce chauffeur
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Status Badge - Prominent placement */}
        <div className="flex justify-center">
          <Badge className={`${config.color} flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full shadow-lg`}>
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </Badge>
        </div>
        {/* Profile Header Card */}
        <Card className="border-neutral-800 shadow-xl bg-gradient-to-br from-neutral-900 to-neutral-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar Section */}
              <div className="relative">
                {editing ? (
                  <Suspense fallback={
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-neutral-800 rounded-full animate-pulse ring-4 ring-neutral-700" />
                  }>
                    <AvatarUpload
                      driverId={driverId}
                      currentAvatarUrl={driver.avatar_url}
                      onUploadComplete={(url) => {
                        setEditedDriver(prev => prev ? { ...prev, avatar_url: url } : null)
                        setDriver(prev => prev ? { ...prev, avatar_url: url } : null)
                        toast({
                          title: "✅ Photo mise à jour",
                          description: "Photo de profil modifiée"
                        })
                      }}
                    />
                  </Suspense>
                ) : (
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-4 ring-neutral-700 shadow-xl">
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
                  <p className="text-lg text-neutral-400">{driver.company_name || "Chauffeur indépendant"}</p>
                  <p className="text-sm text-neutral-500">
                    {driver.phone} • {driver.city || "Ville non renseignée"}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-neutral-800/60 rounded-lg border border-neutral-700">
                    <TrendingUp className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                    <p className="text-sm text-neutral-400">Courses</p>
                    <p className="text-xl font-bold text-white">{driver.total_rides || 0}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-neutral-800/60 rounded-lg border border-neutral-700">
                    <Star className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
                    <p className="text-sm text-neutral-400">Note</p>
                    <p className="text-xl font-bold text-white">{driver.rating || "N/A"}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-neutral-800/60 rounded-lg border border-neutral-700">
                    <CheckCircle className="w-5 h-5 mx-auto text-green-400 mb-1" />
                    <p className="text-sm text-neutral-400">Complétude</p>
                    <p className="text-xl font-bold text-white">{validationData.completionPercentage}%</p>
                  </div>
                  
                  <div className="text-center p-3 bg-neutral-800/60 rounded-lg border border-neutral-700">
                    <Clock className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                    <p className="text-sm text-neutral-400">Expérience</p>
                    <p className="text-xl font-bold text-white">
                      {driver.created_at ? Math.floor((Date.now() - new Date(driver.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0}m
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-neutral-300">
                    <span>Profil complété</span>
                    <span className="font-medium">{validationData.completionPercentage}%</span>
                  </div>
                  <Progress 
                    value={validationData.completionPercentage} 
                    className="h-3 bg-neutral-700"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missing Fields Alert */}
        {validationData.missingFields.length > 0 && (
          <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800 border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Profil incomplet
              </CardTitle>
              <CardDescription className="text-orange-300">
                Certains champs sont manquants pour valider ce chauffeur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {validationData.missingFields.map((field, index) => (
                  <Badge key={index} className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs - Mobile Optimized */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-neutral-800/60 border-neutral-700 backdrop-blur-md border-b h-18 md:h-10">
            <TabsTrigger 
              value="profile" 
              className="flex items-center justify-center gap-1.5 text-neutral-100 data-[state=active]:bg-neutral-700 data-[state=active]:text-white transition-all h-full"
            >
              <User className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">Profil</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex items-center justify-center gap-1.5 text-neutral-100 data-[state=active]:bg-neutral-700 data-[state=active]:text-white transition-all h-full"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">Docs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="flex items-center justify-center gap-1.5 text-neutral-100 data-[state=active]:bg-neutral-700 data-[state=active]:text-white transition-all h-full"
            >
              <History className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">Activité</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center justify-center gap-1.5 text-neutral-100 data-[state=active]:bg-neutral-700 data-[state=active]:text-white transition-all h-full"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Profil */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <User className="w-5 h-5 text-blue-400" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-medium text-neutral-300">Prénom</Label>
                      {editing ? (
                        <Input
                          id="first_name"
                          value={editedDriver?.first_name || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, first_name: e.target.value } : null
                          )}
                          className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                          <p className="font-medium text-neutral-100">{driver.first_name}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-medium text-neutral-300">Nom</Label>
                      {editing ? (
                        <Input
                          id="last_name"
                          value={editedDriver?.last_name || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, last_name: e.target.value } : null
                          )}
                          className="transition-all focus:ring-2 focus:ring-blue-500 bg-neutral-800 border-neutral-600 text-neutral-100"
                        />
                      ) : (
                        <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                          <p className="font-medium text-neutral-100">{driver.last_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-neutral-300">Téléphone</Label>
                    {editing ? (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <Input
                          id="phone"
                          value={editedDriver?.phone || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, phone: e.target.value } : null
                          )}
                          className="pl-10 transition-all focus:ring-2 focus:ring-blue-500 bg-neutral-800 border-neutral-600 text-neutral-100"
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-neutral-400" />
                        <p className="font-medium text-neutral-100">{driver.phone}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-sm font-medium text-neutral-300">Date de naissance</Label>
                    {editing ? (
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={editedDriver?.date_of_birth || ""}
                        max={new Date().toISOString().split('T')[0]} // Empêche la sélection de dates futures
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, date_of_birth: e.target.value } : null
                        )}
                        className="transition-all focus:ring-2 focus:ring-blue-500 bg-neutral-800 border-neutral-600 text-neutral-100"
                      />
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <p className="font-medium text-neutral-100">
                          {driver.date_of_birth ? new Date(driver.date_of_birth).toLocaleDateString() : "Non renseigné"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    Adresse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_line1" className="text-sm font-medium text-neutral-300">Adresse</Label>
                    {editing ? (
                      <Input
                        id="address_line1"
                        value={editedDriver?.address_line1 || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, address_line1: e.target.value } : null
                        )}
                        className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-purple-500"
                        placeholder="123 rue de la République"
                      />
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-medium text-neutral-100">{driver.address_line1 || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-neutral-300">Ville</Label>
                      {editing ? (
                        <Input
                          id="city"
                          value={editedDriver?.city || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, city: e.target.value } : null
                          )}
                          className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-purple-500"
                          placeholder="Paris"
                        />
                      ) : (
                        <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                          <p className="font-medium text-neutral-100">{driver.city || "Non renseigné"}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code" className="text-sm font-medium text-neutral-300">Code postal</Label>
                      {editing ? (
                        <Input
                          id="postal_code"
                          value={editedDriver?.postal_code || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, postal_code: e.target.value } : null
                          )}
                          className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-purple-500"
                          placeholder="75001"
                        />
                      ) : (
                        <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                          <p className="font-medium text-neutral-100">{driver.postal_code || "Non renseigné"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact d'urgence */}
              <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Contact d'urgence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name" className="text-sm font-medium text-neutral-300">Nom du contact</Label>
                    {editing ? (
                      <Input
                        id="emergency_contact_name"
                        value={editedDriver?.emergency_contact_name || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, emergency_contact_name: e.target.value } : null
                        )}
                        className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-red-500"
                        placeholder="Marie Dupont"
                      />
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-medium text-neutral-100">{driver.emergency_contact_name || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone" className="text-sm font-medium text-neutral-300">Téléphone d'urgence</Label>
                    {editing ? (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <Input
                          id="emergency_contact_phone"
                          value={editedDriver?.emergency_contact_phone || ""}
                          onChange={(e) => setEditedDriver(prev => 
                            prev ? { ...prev, emergency_contact_phone: e.target.value } : null
                          )}
                          className="pl-10 bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-red-500"
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-neutral-400" />
                        <p className="font-medium text-neutral-100">{driver.emergency_contact_phone || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informations professionnelles */}
              <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <FileText className="w-5 h-5 text-green-400" />
                    Informations professionnelles
                  </CardTitle>
                  <CardDescription className="text-neutral-300">
                    Numéros de documents professionnels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-sm font-medium text-neutral-300">Nom de l'entreprise</Label>
                    {editing ? (
                      <Input
                        id="company_name"
                        value={editedDriver?.company_name || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, company_name: e.target.value } : null
                        )}
                        className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-green-500"
                        placeholder="SARL Transport Excellence"
                      />
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-medium text-neutral-100">{driver.company_name || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vtc_card_number" className="text-sm font-medium text-neutral-300">Numéro carte VTC</Label>
                    {editing ? (
                      <Input
                        id="vtc_card_number"
                        value={editedDriver?.vtc_card_number || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, vtc_card_number: e.target.value } : null
                        )}
                        className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-green-500"
                        placeholder="VTC123456789"
                      />
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-medium text-neutral-100">{driver.vtc_card_number || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driving_license_number" className="text-sm font-medium text-neutral-300">Numéro permis de conduire</Label>
                    {editing ? (
                      <Input
                        id="driving_license_number"
                        value={editedDriver?.driving_license_number || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, driving_license_number: e.target.value } : null
                        )}
                        className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-green-500"
                        placeholder="123456789ABC"
                      />
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-medium text-neutral-100">{driver.driving_license_number || "Non renseigné"}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_number" className="text-sm font-medium text-neutral-300">Numéro d'assurance</Label>
                    {editing ? (
                      <Input
                        id="insurance_number"
                        value={editedDriver?.insurance_number || ""}
                        onChange={(e) => setEditedDriver(prev => 
                          prev ? { ...prev, insurance_number: e.target.value } : null
                        )}
                        className="bg-neutral-800 text-neutral-100 border-neutral-600 transition-all focus:ring-2 focus:ring-green-500"
                        placeholder="ASS987654321"
                      />
                    ) : (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-medium text-neutral-100">{driver.insurance_number || "Non renseigné"}</p>
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
              <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Documents obligatoires
                  </CardTitle>
                  <CardDescription className="text-neutral-300">
                    Ces documents sont requis pour la validation du profil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Carte VTC */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-neutral-300">Carte VTC</Label>
                      {driver.vtc_card_number && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                          N° {driver.vtc_card_number}
                        </Badge>
                      )}
                    </div>
                    <Suspense fallback={<div className="h-24 bg-neutral-800 rounded-lg animate-pulse" />}>
                      <DocumentUpload
                        driverId={driverId}
                        documentType="vtc_card"
                        label=""
                        currentUrl={(driver.document_urls as any)?.vtc_card}
                        onUploadComplete={(url) => {
                          handleDocumentUpload('vtc_card')
                          toast({
                            title: "✅ Document VTC uploadé",
                            description: "Document enregistré"
                          })
                        }}
                      />
                    </Suspense>
                  </div>

                  {/* Permis de conduire */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-neutral-300">Permis de conduire</Label>
                      {driver.driving_license_number && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                          N° {driver.driving_license_number}
                        </Badge>
                      )}
                    </div>
                    <Suspense fallback={<div className="h-24 bg-neutral-800 rounded-lg animate-pulse" />}>
                      <DocumentUpload
                        driverId={driverId}
                        documentType="driving_license"
                        label=""
                        currentUrl={(driver.document_urls as any)?.driving_license}
                        onUploadComplete={(url) => {
                          handleDocumentUpload('driving_license')
                          toast({
                            title: "✅ Permis uploadé",
                            description: "Document enregistré"
                          })
                        }}
                      />
                    </Suspense>
                  </div>

                  {/* Assurance */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-neutral-300">Assurance</Label>
                      {driver.insurance_number && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                          N° {driver.insurance_number}
                        </Badge>
                      )}
                    </div>
                    <Suspense fallback={<div className="h-24 bg-neutral-800 rounded-lg animate-pulse" />}>
                      <DocumentUpload
                        driverId={driverId}
                        documentType="insurance"
                        label=""
                        currentUrl={(driver.document_urls as any)?.insurance}
                        onUploadComplete={(url) => {
                          handleDocumentUpload('insurance')
                          toast({
                            title: "✅ Assurance uploadée",
                            description: "Document enregistré"
                          })
                        }}
                      />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>

              {/* Documents optionnels */}
              <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <FileText className="w-5 h-5 text-green-400" />
                    Documents optionnels
                  </CardTitle>
                  <CardDescription className="text-neutral-300">
                    Documents supplémentaires pour un profil complet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Suspense fallback={<div className="h-24 bg-neutral-800 rounded-lg animate-pulse" />}>
                    <DocumentUpload
                      driverId={driverId}
                      documentType="medical_certificate"
                      label="Certificat médical"
                      currentUrl={(driver.document_urls as any)?.medical_certificate}
                      onUploadComplete={(url) => {
                        handleDocumentUpload('medical_certificate')
                        toast({
                          title: "✅ Certificat médical uploadé",
                          description: "Document enregistré"
                        })
                      }}
                    />
                  </Suspense>

                  <Suspense fallback={<div className="h-24 bg-neutral-800 rounded-lg animate-pulse" />}>
                    <DocumentUpload
                      driverId={driverId}
                      documentType="tax_certificate"
                      label="Attestation fiscale"
                      currentUrl={(driver.document_urls as any)?.tax_certificate}
                      onUploadComplete={(url) => {
                        toast({
                          title: "✅ Attestation fiscale uploadée",
                          description: "Document enregistré"
                        })
                      }}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Activité */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <History className="w-5 h-5 text-indigo-400" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-400 text-center py-8">
                  Fonctionnalité en cours de développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-neutral-800 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5 text-neutral-400" />
                  Paramètres du compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-400 text-center py-8">
                  Fonctionnalité en cours de développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Validation Button */}
      {driver.status === 'pending_validation' && validationData?.isComplete && (
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
