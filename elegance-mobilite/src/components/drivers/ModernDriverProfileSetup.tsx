"use client"

import { useState, useEffect } from "react"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ButtonLoading } from "@/components/ui/loading"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/database/client"
import { DocumentUpload } from "@/components/FileUpload"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useDriverProfileCompleteness } from "@/hooks/useDriverProfileCompleteness"
import { useQueryClient } from '@tanstack/react-query'
import { User, Car, Phone, CreditCard, Building2, MapPin, Calendar, Hash, Palette, ArrowRight } from "lucide-react"
import type { Database } from "@/lib/types/database.types"

type DriverInsert = Database['public']['Tables']['drivers']['Insert']

// Schéma de validation pour le profil chauffeur - Version complète
const driverProfileSchema = z.object({
  // Informations personnelles obligatoires
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  date_of_birth: z.string().min(1, "Date de naissance requise"),
  
  // Adresse obligatoire
  address_line1: z.string().min(5, "Adresse complète requise"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "Ville requise"),
  postal_code: z.string().min(5, "Code postal requis"),
  
  // Contact d'urgence obligatoire
  emergency_contact_name: z.string().min(2, "Nom du contact d'urgence requis"),
  emergency_contact_phone: z.string().min(10, "Téléphone d'urgence requis"),
  
  // Informations société
  company_name: z.string().min(2, "Le nom de la société est requis"),
  company_phone: z.string().min(10, "Numéro de téléphone de la société invalide"),
  
  // Champs employé optionnels
  employee_name: z.string().optional(),
  employee_phone: z.string().optional(),
  
  // Documents et certifications obligatoires
  driving_license_number: z.string().min(5, "Numéro de permis invalide"),
  driving_license_expiry_date: z.string().min(1, "Date d'expiration du permis requise"),
  vtc_card_number: z.string().min(5, "Numéro de carte VTC invalide"),
  vtc_card_expiry_date: z.string().min(1, "Date d'expiration de la carte VTC requise"),
  
  // Assurance optionnelle
  insurance_number: z.string().optional(),
  insurance_expiry_date: z.string().optional(),
})

interface FormData {
  // Informations personnelles
  first_name: string
  last_name: string
  phone: string
  date_of_birth: string
  
  // Adresse
  address_line1: string
  address_line2?: string
  city: string
  postal_code: string
  
  // Contact d'urgence
  emergency_contact_name: string
  emergency_contact_phone: string
  
  // Informations société
  company_name: string
  company_phone: string
  employee_name?: string
  employee_phone?: string
  
  // Documents et certifications
  driving_license_number: string
  driving_license_expiry_date: string
  vtc_card_number: string
  vtc_card_expiry_date: string
  insurance_number?: string
  insurance_expiry_date?: string
}

interface ModernDriverProfileSetupProps {
  userId: string
}

export default function ModernDriverProfileSetup({ userId }: ModernDriverProfileSetupProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [allowStepValidation, setAllowStepValidation] = useState(false) // Flag pour contrôler la validation
  const [showHelpModal, setShowHelpModal] = useState(false) // Modal d'aide
  
  // État pour les documents existants (remplace useDriverDocuments)
  const [existingDocuments, setExistingDocuments] = useState<Record<string, { url: string; name: string; size: number }>>({})

  // Système de brouillon localStorage
  const draftKey = `driver-profile-draft-${userId}`
  const [formData, setFormData] = useState<FormData>(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem(draftKey)
      if (draft) return JSON.parse(draft)
    }
    return {
      // Informations personnelles
      first_name: "",
      last_name: "",
      phone: "",
      date_of_birth: "",
      
      // Adresse
      address_line1: "",
      address_line2: "",
      city: "",
      postal_code: "",
      
      // Contact d'urgence
      emergency_contact_name: "",
      emergency_contact_phone: "",
      
      // Informations société
      company_name: "",
      company_phone: "",
      employee_name: "",
      employee_phone: "",
      
      // Documents et certifications
      driving_license_number: "",
      driving_license_expiry_date: "",
      vtc_card_number: "",
      vtc_card_expiry_date: "",
      insurance_number: "",
      insurance_expiry_date: "",
    }
  })

  // Sauvegarde automatique du brouillon
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(draftKey, JSON.stringify(formData))
    }
  }, [formData])


  // Hook pour vérifier la complétude du profil depuis Supabase
  const { data: profileCompleteness, isLoading: isLoadingCompleteness } = useDriverProfileCompleteness(userId)

  // État pour l'ID du driver (différent de userId)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [driverData, setDriverData] = useState<any>(null) // Pour avoir accès aux document_urls

  // Récupérer l'ID du driver et ses données correspondant au userId
  useEffect(() => {
    const getDriverData = async () => {
      try {
        const { data: driver, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (driver && !error) {
          setDriverId(driver.id)
          setDriverData(driver)
        }
      } catch (error) {
        console.error('Erreur récupération driver données:', error)
      }
    }

    if (userId) {
      getDriverData()
    }
  }, [userId])

  // Gestion des documents uploadés
  type UploadedDocuments = {
    driving_license?: string
    vtc_card?: string
    insurance?: string
  }
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocuments>({})

  // Handler pour l'upload de documents
  const handleDocumentUpload = (fileType: 'driving_license' | 'vtc_card' | 'insurance', url: string) => {
    setUploadedDocuments(prev => ({ ...prev, [fileType]: url }))
    // Rafraîchir les données du driver après upload
    setTimeout(() => {
      if (userId) {
        // Recharger les données du driver pour récupérer les nouveaux documents
        const refreshDriverData = async () => {
          try {
            const { data: driver, error } = await supabase
              .from('drivers')
              .select('*')
              .eq('user_id', userId)
              .single()

            if (driver && !error) {
              setDriverData(driver)
              // Mettre à jour les documents existants
              const docUrls = (driver.document_urls as any) || {}
              const existingDocs: Record<string, { url: string; name: string; size: number }> = {}
              
              if (docUrls.driving_license) {
                existingDocs.driving_license = {
                  url: docUrls.driving_license,
                  name: 'Permis de conduire.pdf',
                  size: 0
                }
              }
              if (docUrls.vtc_card) {
                existingDocs.vtc_card = {
                  url: docUrls.vtc_card,
                  name: 'Carte VTC.pdf',
                  size: 0
                }
              }
              if (docUrls.insurance) {
                existingDocs.insurance = {
                  url: docUrls.insurance,
                  name: 'Assurance véhicule.pdf',
                  size: 0
                }
              }

              setExistingDocuments(existingDocs)
            }
          } catch (error) {
            console.error('Erreur lors du rafraîchissement des données driver:', error)
          }
        }
        refreshDriverData()
      }
    }, 500)
  }

  // Utiliser les données de Supabase pour la complétude au lieu d'un calcul local
  const completeness = {
    isComplete: profileCompleteness?.is_complete || false,
    missingFields: profileCompleteness?.missing_fields || [],
    completionPercentage: profileCompleteness?.completion_percentage || 0
  }

  // Vérifier si un profil existe déjà
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        // Invalider d'abord la cache pour avoir les données fraîches
        queryClient.invalidateQueries({ queryKey: ['driver-profile-completeness', userId] })
        
        // D'abord, vérifier l'état de l'utilisateur authentifié
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.warn('⚠️ Utilisateur non authentifié:', authError)
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter pour créer votre profil.",
            variant: "destructive"
          })
          router.push('/driver-portal/login')
          return
        }

        console.log('✅ Utilisateur authentifié:', {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at
        })

        // Vérifier si l'email est confirmé
        if (!user.email_confirmed_at) {
          toast({
            title: "Email non confirmé",
            description: "Veuillez confirmer votre email avant de créer votre profil chauffeur.",
            variant: "destructive"
          })
          router.push('/auth/verify-email?type=driver')
          return
        }

        console.log('🔍 Vérification du profil driver pour user_id:', userId)
        
        const { data: existingDriver, error: driverCheckError } = await supabase
          .from('drivers')
          .select('*') // Sélectionner tous les champs pour pré-remplir le formulaire
          .eq('user_id', userId)
          .single()

        if (driverCheckError) {
          console.log('⚠️ Erreur lors de la vérification du profil driver:', driverCheckError)
          // Avec le trigger, cela ne devrait pas arriver, mais au cas où...
        } else if (existingDriver) {
          console.log('📋 Profil driver trouvé:', existingDriver)
          
          // Vérifier si le profil est déjà complet
          const isProfileComplete = existingDriver.status !== 'incomplete' && 
            existingDriver.driving_license_number && 
            existingDriver.driving_license_number !== 'À compléter' &&
            existingDriver.vtc_card_number && 
            existingDriver.vtc_card_number !== 'À compléter'
            
          if (isProfileComplete) {
            console.log('✅ Profil déjà complet - redirection vers le dashboard')
            toast({
              title: "Profil déjà complet",
              description: "Votre profil chauffeur est déjà rempli. Redirection vers le dashboard...",
            })
            router.push('/driver-portal')
            return
          } else {
            console.log('📝 Profil incomplet - l\'utilisateur peut le compléter')
            // Pré-remplir le formulaire avec les données existantes
            const driver = existingDriver as any
            if (driver.first_name) {
              setFormData(prev => ({
                ...prev,
                // Informations personnelles
                first_name: driver.first_name || '',
                last_name: driver.last_name || '',
                phone: driver.phone || '',
                date_of_birth: driver.date_of_birth || '',
                
                // Adresse
                address_line1: driver.address_line1 || '',
                address_line2: driver.address_line2 || '',
                city: driver.city || '',
                postal_code: driver.postal_code || '',
                
                // Contact d'urgence
                emergency_contact_name: driver.emergency_contact_name || '',
                emergency_contact_phone: driver.emergency_contact_phone || '',
                
                // Informations société
                company_name: driver.company_name || '',
                company_phone: driver.company_phone || '',
                employee_name: driver.employee_name || '',
                employee_phone: driver.employee_phone || '',
                
                // Documents et certifications
                driving_license_number: driver.driving_license_number || '',
                driving_license_expiry_date: driver.driving_license_expiry_date || '',
                vtc_card_number: driver.vtc_card_number || '',
                vtc_card_expiry_date: driver.vtc_card_expiry_date || '',
                insurance_number: driver.insurance_number || '',
                insurance_expiry_date: driver.insurance_expiry_date || ''
              }))

              // Utiliser directement document_urls comme dans le backoffice - plus simple et fiable
              const docUrls = (driver.document_urls as any) || {}
              const existingDocs: Record<string, { url: string; name: string; size: number }> = {}
              
              if (docUrls.driving_license) {
                existingDocs.driving_license = {
                  url: docUrls.driving_license,
                  name: 'Permis de conduire.pdf',
                  size: 0
                }
              }
              if (docUrls.vtc_card) {
                existingDocs.vtc_card = {
                  url: docUrls.vtc_card,
                  name: 'Carte VTC.pdf',
                  size: 0
                }
              }
              if (docUrls.insurance) {
                existingDocs.insurance = {
                  url: docUrls.insurance,
                  name: 'Assurance véhicule.pdf',
                  size: 0
                }
              }

              setExistingDocuments(existingDocs)
              console.log('📄 Documents existants chargés depuis document_urls:', existingDocs)
            }
          }
        }

        // Avec le trigger en place, public.users et public.drivers sont créés automatiquement
        console.log('✅ Trigger automatique activé - utilisateur et profil gérés automatiquement')
      } catch (error) {
        console.log('⚠️ Erreur pendant la vérification du profil existant:', error)
      }
    }

    checkExistingProfile()
  }, [userId, router, toast, queryClient])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Effacer l'erreur si l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  // Navigation automatique sans validation (pour Enter)
  const navigateToNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1)
      console.log('🔄 Navigation automatique vers étape', currentStep + 1)
    }
  }

  // Empêcher la soumission accidentelle par Entrée
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      console.log('🔄 Entrée pressée - navigation vers étape suivante au lieu de submit')
      // Si on est pas à la dernière étape, aller à l'étape suivante SANS validation
      if (currentStep < 6) {
        navigateToNextStep()
      }
      // Sinon, ne rien faire (le bouton submit s'occupera de la soumission)
    }
  }

  // Gestionnaire global pour empêcher les soumissions accidentelles
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      
      if (currentStep !== 6) {
        console.log('🔄 Entrée pressée - Navigation automatique vers étape suivante')
        navigateToNextStep()
      } else {
        console.log('🔄 Entrée pressée à l\'étape finale - Pas d\'action automatique')
        // À l'étape finale, l'utilisateur doit cliquer explicitement sur le bouton
      }
    }
  }

  const validateCurrentStep = (): boolean => {
    console.log('🔍 validateCurrentStep appelée pour l\'étape', currentStep)
    setErrors({})
    const stepFields = getStepFields(currentStep)
    
    // Si pas de champs à valider (étape 4), retourner true directement
    if (stepFields.length === 0) {
      console.log('ℹ️ Aucun champ à valider pour l\'étape', currentStep)
      return true
    }
    
    const stepData = Object.fromEntries(
      stepFields.map(field => [field, formData[field as keyof FormData]])
    )

    try {
      const stepSchema = driverProfileSchema.pick(
        Object.fromEntries(stepFields.map(f => [f, true])) as any
      )
      stepSchema.parse(stepData)
      console.log('✅ Validation réussie pour l\'étape', currentStep)
      return true
    } catch (error: any) {
      console.log('❌ Erreur de validation pour l\'étape', currentStep, ':', error.message)
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const getStepFields = (step: number): string[] => {
    // Pour éviter toute validation prématurée, ne pas retourner de champs obligatoires
    // La validation se fera uniquement lors de la soumission finale
    console.log('🔍 getStepFields appelée pour l\'étape', step, '- retour de champs vides pour éviter validation prématurée')
    return [] // Pas de validation par étapes pour éviter les erreurs prématurées
  }

  const nextStep = (forceValidation = true) => {
    // Pour l'étape 6, pas de validation nécessaire
    if (currentStep === 6) {
      return // Déjà à la dernière étape
    }
    
    console.log('🔄 Tentative de passage à l\'étape suivante depuis l\'étape', currentStep, 'avec validation:', forceValidation)
    
    // Si la validation n'est pas forcée (navigation automatique), passer directement
    if (!forceValidation) {
      console.log('⏭️ Navigation automatique sans validation')
      setCurrentStep(prev => Math.min(prev + 1, 6))
      return
    }
    
    // Sinon, valider avant de passer
    if (validateCurrentStep()) {
      console.log('✅ Validation réussie, passage à l\'étape', currentStep + 1)
      setCurrentStep(prev => Math.min(prev + 1, 6))
    } else {
      console.log('❌ Validation échouée pour l\'étape', currentStep)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Log détaillé de l'utilisateur authentifié depuis Supabase auth
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.log('❌ Erreur lors de la récupération de l\'utilisateur auth:', authError)
      } else {
        console.log('🔐 Utilisateur auth.users complet:', user)
        console.log('📧 Email:', user?.email)
        console.log('📅 Créé le:', user?.created_at)
        console.log('✅ Email confirmé le:', user?.email_confirmed_at)
        console.log('🏷️ App metadata:', user?.app_metadata)
        console.log('👤 User metadata:', user?.user_metadata)
      }
    } catch (authError) {
      console.log('⚠️ Erreur pendant la récupération auth:', authError)
    }
    
    // PROTECTION STRICTE : Empêcher absolument toute soumission avant l'étape 6
    if (currentStep !== 6) {
      console.warn('🛑 SOUMISSION BLOQUÉE - Étape actuelle:', currentStep, '- Étape requise: 6')
      e.stopPropagation()
      return false
    }
    
    console.log('✅ Soumission autorisée - Utilisateur à l\'étape finale')
    
    // Logs de diagnostic pour vérifier l'état des tables
    try {
      console.log('🔍 Diagnostic - Recherche dans public.users pour ID:', userId)
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (userError) {
        console.log('❌ Erreur lors de la recherche dans public.users:', userError)
      } else {
        console.log('📋 Données public.users trouvées:', publicUser)
      }
      
      console.log('🔍 Diagnostic - Recherche dans public.drivers pour ID:', userId)
      const { data: publicDriver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (driverError && driverError.code !== 'PGRST116') { // PGRST116 = pas trouvé, c'est normal
        console.log('❌ Erreur lors de la recherche dans public.drivers:', driverError)
      } else if (publicDriver) {
        console.log('📋 Données public.drivers trouvées:', publicDriver)
      } else {
        console.log('ℹ️ Aucun profil driver trouvé (normal pour une première création)')
      }
    } catch (diagError) {
      console.log('⚠️ Erreur pendant le diagnostic:', diagError)
    }
    
    // Validation finale des champs absolument obligatoires selon la DB
    // Note: On permet la soumission même si des champs sont manquants
    // L'équipe pourra aider lors du rendez-vous de validation
    const requiredFields = [
      'first_name', 'last_name', 'phone', 'user_id'
    ]
    const missingCriticalFields: string[] = []
    
    // Vérifier seulement les champs vraiment critiques
    if (!formData.first_name) missingCriticalFields.push('Prénom')
    if (!formData.last_name) missingCriticalFields.push('Nom')
    if (!formData.phone) missingCriticalFields.push('Téléphone')
    if (!userId) missingCriticalFields.push('Identifiant utilisateur')
    
    if (missingCriticalFields.length > 0) {
      console.warn('⚠️ Champs critiques manquants:', missingCriticalFields)
      setErrors({ submit: `Informations essentielles manquantes: ${missingCriticalFields.join(', ')}. Ces informations sont nécessaires pour créer votre profil.` })
      return
    }

    setIsLoading(true)

    try {
      console.log('🚀 Mise à jour du profil chauffeur...', { userId })
      
      // Vérifier que userId est bien fourni
      if (!userId) {
        throw new Error('ID utilisateur manquant')
      }

      // Avec le trigger en place, l'utilisateur et le profil driver existent déjà
      // Nous allons simplement mettre à jour le profil driver avec les données complètes
      console.log('📝 Préparation des données pour la mise à jour du profil...')
      
      // Préparer les données pour la mise à jour - avec gestion des champs optionnels
      const driverData: DriverInsert = {
        user_id: userId,
        // Informations personnelles
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        
        // Adresse
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        city: formData.city,
        postal_code: formData.postal_code,
        
        // Contact d'urgence
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        
        // Champs société
        company_name: formData.company_name,
        company_phone: formData.company_phone,
        
        // Champs employé optionnels
        employee_name: formData.employee_name || formData.first_name + ' ' + (formData.last_name || ''),
        employee_phone: formData.employee_phone || formData.phone,
        
        // Documents obligatoires
        driving_license_number: formData.driving_license_number,
        driving_license_expiry_date: formData.driving_license_expiry_date,
        vtc_card_number: formData.vtc_card_number,
        vtc_card_expiry_date: formData.vtc_card_expiry_date,
        
        // Assurance optionnelle
        insurance_number: formData.insurance_number || null,
        insurance_expiry_date: formData.insurance_expiry_date || null,
        
        // Statut par défaut
        status: 'pending_validation',
      }

      console.log('📝 Données à mettre à jour:', driverData)

      // Utiliser UPSERT pour créer OU mettre à jour le profil
      // (solution robuste qui fonctionne que le profil existe ou non)
      console.log('🔄 Création ou mise à jour du profil chauffeur...')

      const { data, error } = await supabase
        .from('drivers')
        .upsert(driverData, {
          onConflict: 'user_id'  // Si user_id existe, faire UPDATE, sinon INSERT
        })
        .select()
        .single()

      if (error) {
        console.warn('⚠️ Erreur Supabase:', error)
        throw error
      }

      console.log('✅ Profil chauffeur créé/mis à jour:', data)

      // Invalider la cache de complétude pour mettre à jour l'affichage immédiatement
      queryClient.invalidateQueries({ queryKey: ['driver-profile-completeness', userId] })

      toast({
        title: "Profil envoyé avec succès !",
        description: completeness.isComplete 
          ? "Votre profil complet a été soumis pour validation. Vous serez contacté sous 48h."
          : "Votre profil a été envoyé. Notre équipe vous recontactera pour finaliser les informations manquantes lors de votre rendez-vous de validation.",
      })

      // Redirection vers le dashboard
      router.push('/driver-portal')

    } catch (error: any) {
      console.warn('⚠️ Erreur lors de la création du profil:', error)
      
      // Gestion d'erreurs spécifiques
      let errorMessage = "Une erreur est survenue lors de la création du profil."
      
      if (error?.code === '23505') {
        errorMessage = "Un profil existe déjà pour cet utilisateur."
      } else if (error?.code === '23502') {
        errorMessage = "Certains champs obligatoires sont manquants."
      } else if (error?.code === '23503') {
        errorMessage = "Référence invalide vers un utilisateur."
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Erreur de création",
        description: errorMessage,
        variant: "destructive"
      })
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-neutral-300">Prénom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Jean"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.first_name && <p className="text-red-400 text-sm">{errors.first_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-neutral-300">Nom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Dupont"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.last_name && <p className="text-red-400 text-sm">{errors.last_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-neutral-300">Téléphone personnel *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="+33 6 12 34 56 78"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.phone && <p className="text-red-400 text-sm">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-neutral-300">Date de naissance *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.date_of_birth && <p className="text-red-400 text-sm">{errors.date_of_birth}</p>}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1" className="text-neutral-300">Adresse *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="address_line1"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="123 rue de la République"
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.address_line1 && <p className="text-red-400 text-sm">{errors.address_line1}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2" className="text-neutral-300">
                Complément d'adresse <span className="text-neutral-500 text-sm">(optionnel)</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="address_line2"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Appartement, étage, bâtiment..."
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.address_line2 && <p className="text-red-400 text-sm">{errors.address_line2}</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-neutral-300">Ville *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Paris"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.city && <p className="text-red-400 text-sm">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-neutral-300">Code postal *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="75001"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.postal_code && <p className="text-red-400 text-sm">{errors.postal_code}</p>}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name" className="text-neutral-300">Nom du contact d'urgence *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Marie Dupont"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.emergency_contact_name && <p className="text-red-400 text-sm">{errors.emergency_contact_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone" className="text-neutral-300">Téléphone d'urgence *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="+33 6 98 76 54 32"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.emergency_contact_phone && <p className="text-red-400 text-sm">{errors.emergency_contact_phone}</p>}
              </div>
            </div>

            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-200 text-sm">
                💡 <strong>Information :</strong> Ce contact sera utilisé uniquement en cas d'urgence. Assurez-vous que cette personne soit joignable.
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-neutral-300">Nom de la société *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Élégance Mobilité"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.company_name && <p className="text-red-400 text-sm">{errors.company_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_phone" className="text-neutral-300">Téléphone société *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="company_phone"
                    name="company_phone"
                    value={formData.company_phone}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="+33 1 23 45 67 89"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.company_phone && <p className="text-red-400 text-sm">{errors.company_phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_name" className="text-neutral-300">
                  Nom de l'employé <span className="text-neutral-500 text-sm">(optionnel)</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="employee_name"
                    name="employee_name"
                    value={formData.employee_name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Si différent de vos nom/prénom"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.employee_name && <p className="text-red-400 text-sm">{errors.employee_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_phone" className="text-neutral-300">
                  Téléphone employé <span className="text-neutral-500 text-sm">(optionnel)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="employee_phone"
                    name="employee_phone"
                    value={formData.employee_phone}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Si différent de votre téléphone personnel"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.employee_phone && <p className="text-red-400 text-sm">{errors.employee_phone}</p>}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driving_license_number" className="text-neutral-300">Numéro de permis de conduire *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="driving_license_number"
                    name="driving_license_number"
                    value={formData.driving_license_number}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="123456789012"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.driving_license_number && <p className="text-red-400 text-sm">{errors.driving_license_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driving_license_expiry_date" className="text-neutral-300">Date d'expiration du permis *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="driving_license_expiry_date"
                    name="driving_license_expiry_date"
                    type="date"
                    value={formData.driving_license_expiry_date}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.driving_license_expiry_date && <p className="text-red-400 text-sm">{errors.driving_license_expiry_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vtc_card_number" className="text-neutral-300">Numéro de carte VTC *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="vtc_card_number"
                    name="vtc_card_number"
                    value={formData.vtc_card_number}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="VTC123456789"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.vtc_card_number && <p className="text-red-400 text-sm">{errors.vtc_card_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vtc_card_expiry_date" className="text-neutral-300">Date d'expiration carte VTC *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="vtc_card_expiry_date"
                    name="vtc_card_expiry_date"
                    type="date"
                    value={formData.vtc_card_expiry_date}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.vtc_card_expiry_date && <p className="text-red-400 text-sm">{errors.vtc_card_expiry_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_number" className="text-neutral-300">
                  Numéro d'assurance <span className="text-neutral-500 text-sm">(optionnel)</span>
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="insurance_number"
                    name="insurance_number"
                    value={formData.insurance_number}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="ASS123456789"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.insurance_number && <p className="text-red-400 text-sm">{errors.insurance_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_expiry_date" className="text-neutral-300">
                  Date d'expiration assurance <span className="text-neutral-500 text-sm">(optionnel)</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="insurance_expiry_date"
                    name="insurance_expiry_date"
                    type="date"
                    value={formData.insurance_expiry_date}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.insurance_expiry_date && <p className="text-red-400 text-sm">{errors.insurance_expiry_date}</p>}
              </div>
            </div>

            {/* Upload de documents obligatoires avec ordre cohérent et récupération des documents existants */}
            <div className="space-y-4 mt-6">
              <Label className="text-neutral-300 text-lg font-semibold">Documents à fournir</Label>
              
              {driverId ? (
                <>
                  {/* Document 1: Permis de conduire */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                      <span className="text-neutral-300 font-medium">Permis de conduire (scan/photo)</span>
                      {existingDocuments.driving_license && (
                        <span className="text-green-400 text-sm">✓ Déjà fourni</span>
                      )}
                    </div>
                    <DocumentUpload
                      label="Uploader le permis de conduire"
                      documentType="driving_license"
                      driverId={driverId}
                      userId={userId}
                      currentUrl={(driverData?.document_urls as any)?.driving_license}
                      onUploadComplete={(url: string) => handleDocumentUpload('driving_license', url)}
                    />
                  </div>

                  {/* Document 2: Carte VTC */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                      <span className="text-neutral-300 font-medium">Carte VTC (scan/photo)</span>
                      {existingDocuments.vtc_card && (
                        <span className="text-green-400 text-sm">✓ Déjà fourni</span>
                      )}
                    </div>
                    <DocumentUpload
                      label="Uploader la carte VTC"
                      documentType="vtc_card"
                      driverId={driverId}
                      userId={userId}
                      currentUrl={(driverData?.document_urls as any)?.vtc_card}
                      onUploadComplete={(url: string) => handleDocumentUpload('vtc_card', url)}
                    />
                  </div>

                  {/* Document 3: Assurance (optionnel) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-neutral-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                      <span className="text-neutral-300 font-medium">Assurance véhicule <span className="text-neutral-500 text-sm">(optionnel)</span></span>
                      {existingDocuments.insurance && (
                        <span className="text-green-400 text-sm">✓ Déjà fourni</span>
                      )}
                    </div>
                    <DocumentUpload
                      label="Uploader l'assurance"
                      documentType="insurance"
                      driverId={driverId}
                      userId={userId}
                      onUploadComplete={(url: string) => handleDocumentUpload('insurance', url)}
                      currentUrl={existingDocuments.insurance?.url || uploadedDocuments.insurance}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-neutral-400">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    Chargement du profil pour l'upload de documents...
                  </div>
                </div>
              )}

              <div className="text-xs text-neutral-500 mt-4 p-3 bg-neutral-800/50 rounded-lg">
                <strong>Important :</strong> Les documents doivent être lisibles et à jour. 
                Si vous avez déjà fourni un document, il n'est pas nécessaire de le re-télécharger sauf si vous souhaitez le remplacer.
              </div>
            </div>

            {/* Feedback de complétude */}
            <div className="mt-4">
              <div className={`rounded-lg p-3 text-sm ${completeness.isComplete ? 'bg-green-900/20 border border-green-700/30 text-green-200' : 'bg-yellow-900/20 border border-yellow-700/30 text-yellow-200'}`}>
                {completeness.isComplete
                  ? '✅ Toutes les informations et documents obligatoires sont fournis. Vous pouvez passer à la validation finale.'
                  : `⚠️ Il manque encore des informations ou documents obligatoires : ${completeness.missingFields.join(', ')}`
                }
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            {/* Message de confirmation avant soumission */}
            <div className={`p-4 rounded-lg ${
              completeness.isComplete 
                ? 'bg-green-900/20 border border-green-700/30' 
                : 'bg-yellow-900/20 border border-yellow-700/30'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                completeness.isComplete 
                  ? 'text-green-200' 
                  : 'text-yellow-200'
              }`}>
                {completeness.isComplete 
                  ? '✅ Profil complet !' 
                  : '⚠️ Profil incomplet'
                }
              </h3>
              <p className={`text-sm ${
                completeness.isComplete 
                  ? 'text-green-200' 
                  : 'text-yellow-200'
              }`}>
                {completeness.isComplete 
                  ? 'Parfait ! Vérifiez vos informations ci-dessous, puis envoyez votre profil pour validation.'
                  : 'Pour une validation rapide, nous recommandons fortement de compléter toutes les informations avant l\'envoi.'
                }
              </p>
              {!completeness.isComplete && (
                <div className="mt-3 space-y-2">
                  <div className="p-2 bg-yellow-800/20 rounded-md">
                    <p className="text-yellow-100 text-xs">
                      📝 <strong>Informations manquantes :</strong> {completeness.missingFields.map(field => {
                        const fieldNames: Record<string, string> = {
                          'first_name': 'Prénom',
                          'last_name': 'Nom',
                          'phone': 'Téléphone',
                          'date_of_birth': 'Date de naissance',
                          'address_line1': 'Adresse',
                          'city': 'Ville',
                          'postal_code': 'Code postal',
                          'emergency_contact_name': 'Contact d\'urgence',
                          'emergency_contact_phone': 'Téléphone d\'urgence',
                          'company_name': 'Nom société',
                          'company_phone': 'Téléphone société',
                          'driving_license_number': 'N° permis',
                          'driving_license_expiry_date': 'Date expiration permis',
                          'vtc_card_number': 'N° carte VTC',
                          'vtc_card_expiry_date': 'Date expiration VTC',
                          'driving_license': 'Document permis',
                          'vtc_card': 'Document carte VTC'
                        };
                        return fieldNames[field] || field;
                      }).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-800/20 rounded-md">
                    <p className="text-blue-100 text-xs">
                      💡 <strong>Conseil :</strong> Un profil complet accélère votre validation.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowHelpModal(true)}
                      className="text-blue-300 hover:text-blue-200 text-xs underline"
                    >
                      Besoin d'aide ?
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Résumé des informations */}
            <div className="space-y-4 max-h-96 overflow-y-auto bg-neutral-800/30 rounded-lg p-4">
              <h4 className="text-neutral-200 font-semibold">Résumé de votre profil :</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="text-neutral-300">Nom complet :</strong>
                  <p className="text-neutral-400">{formData.first_name} {formData.last_name}</p>
                </div>
                <div>
                  <strong className="text-neutral-300">Téléphone :</strong>
                  <p className="text-neutral-400">{formData.phone}</p>
                </div>
                <div>
                  <strong className="text-neutral-300">Date de naissance :</strong>
                  <p className="text-neutral-400">{formData.date_of_birth}</p>
                </div>
                <div>
                  <strong className="text-neutral-300">Société :</strong>
                  <p className="text-neutral-400">{formData.company_name}</p>
                </div>
                <div>
                  <strong className="text-neutral-300">Adresse :</strong>
                  <p className="text-neutral-400">{formData.address_line1}, {formData.city} {formData.postal_code}</p>
                </div>
                <div>
                  <strong className="text-neutral-300">Contact d'urgence :</strong>
                  <p className="text-neutral-400">{formData.emergency_contact_name} ({formData.emergency_contact_phone})</p>
                </div>
                <div>
                  <strong className="text-neutral-300">Permis de conduire :</strong>
                  <p className="text-neutral-400">{formData.driving_license_number}</p>
                </div>
                <div>
                  <strong className="text-neutral-300">Carte VTC :</strong>
                  <p className="text-neutral-400">{formData.vtc_card_number}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-700">
                <strong className="text-neutral-300">Documents fournis :</strong>
                <ul className="text-neutral-400 text-sm mt-1">
                  <li>• {existingDocuments.driving_license || uploadedDocuments.driving_license ? '✅' : '❌'} Permis de conduire</li>
                  <li>• {existingDocuments.vtc_card || uploadedDocuments.vtc_card ? '✅' : '❌'} Carte VTC</li>
                  <li>• {existingDocuments.insurance || uploadedDocuments.insurance ? '✅' : '⚪'} Assurance (optionnel)</li>
                </ul>
              </div>
            </div>

            {/* Message d'information sur la suite du processus */}
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-200 text-sm">
                <strong>Prochaine étape :</strong> Notre équipe vérifiera vos informations et vous contactera pour planifier un rendez-vous de validation. 
                {" "}Un profil complet permet une validation plus rapide et efficace.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const stepTitles = [
    "Informations personnelles",
    "Adresse",
    "Contact d'urgence",
    "Informations société",
    "Documents et certifications",
    "Validation finale"
  ]

  const progress = (currentStep / 6) * 100

  return (
    <div className="min-h-screen bg-neutral-950 bg-elegant-gradient py-8 px-4">
      <div className="container mx-auto max-w-md lg:max-w-4xl xl:max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Profil Chauffeur</h1>
          <p className="text-neutral-400">Complétez votre profil pour commencer</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-neutral-400 mb-2">
            <span>Étape {currentStep} sur 6</span>
            <span>{isLoadingCompleteness ? '...' : `${completeness.completionPercentage}%`} complété</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${isLoadingCompleteness ? progress : completeness.completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Feedback de complétude global */}
        <div className="mb-6">
          <div className={`rounded-lg p-3 text-sm ${completeness.isComplete ? 'bg-green-900/20 border border-green-700/30 text-green-200' : 'bg-yellow-900/20 border border-yellow-700/30 text-yellow-200'}`}>
            {isLoadingCompleteness ? (
              '🔄 Vérification de la complétude du profil...'
            ) : completeness.isComplete ? (
              '🎉 Votre profil est complet ! Vous pouvez finaliser votre inscription.'
            ) : (
              `⚠️ Profil incomplet (${completeness.completionPercentage}%) - Complétez les ${completeness.missingFields.length} information(s) manquante(s) pour une validation optimale`
            )}
          </div>
        </div>

        {/* Modal d'aide */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-lg p-6 max-w-md w-full border border-neutral-700">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-blue-400 text-2xl">🤝</span>
                <div>
                  <h3 className="text-white font-semibold mb-2">Aide pour compléter votre profil</h3>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    Notre équipe peut vous accompagner gratuitement pour compléter votre profil lors d'un rendez-vous de validation en cas de difficultés à compléter votre profil.
                  </p>
                  <p className="text-neutral-300 text-sm leading-relaxed mt-3">
                    Appelez-nous au <strong className="text-blue-400">01 XX XX XX XX</strong> ou envoyez votre profil maintenant - nous vous recontacterons.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md text-sm transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowHelpModal(false)
                    // Optionnel : déclencher un appel téléphonique
                    window.open('tel:01XXXXXXXX', '_self')
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                >
                  Appeler maintenant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <Card className="elegant-backdrop">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Car className="w-5 h-5 mr-2 text-blue-400" />
              {stepTitles[currentStep - 1]}
            </CardTitle>
            <CardDescription className="text-neutral-400">
              {currentStep < 6 
                ? "Renseignez vos informations - vous pourrez naviguer librement entre les étapes"
                : "Vérifiez vos informations avant de soumettre votre profil pour validation"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
              {renderStep()}

              {errors.submit && (
                <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      prevStep()
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Précédent
                  </Button>
                )}
                
                {currentStep < 6 ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('👆 Clic sur bouton Suivant - Navigation simple sans validation')
                      // Navigation simple sans validation puisqu'on ne valide qu'à la fin
                      navigateToNextStep()
                    }}
                    disabled={isLoading}
                    className="flex-1 btn-gradient text-white"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-gradient text-white"
                  >
                    {isLoading ? (
                      <ButtonLoading />
                    ) : (
                      <span className="flex items-center gap-2 text-white">
                        Envoyer pour validation
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/driver-portal')}
            className="text-neutral-500 hover:text-neutral-400 text-sm"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
