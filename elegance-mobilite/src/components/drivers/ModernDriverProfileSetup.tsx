"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ButtonLoading } from "@/components/ui/loading"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/database/client"
import { useToast } from "@/hooks/useToast"
import { User, Car, Phone, CreditCard, Building2, MapPin, Calendar, Hash, Palette, ArrowRight } from "lucide-react"
import type { Database } from "@/lib/types/database.types"

type DriverInsert = Database['public']['Tables']['drivers']['Insert']

// Schéma de validation pour le profil chauffeur - Version allégée
const driverProfileSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  company_name: z.string().min(2, "Le nom de la société est requis"),
  company_phone: z.string().min(10, "Numéro de téléphone de la société invalide"),
  // Champs employé optionnels - peuvent être complétés plus tard
  employee_name: z.string().optional(),
  employee_phone: z.string().optional(),
  driving_license_number: z.string().min(5, "Numéro de permis invalide"),
  driving_license_expiry_date: z.string().min(1, "Date d'expiration du permis requise"),
  vtc_card_number: z.string().min(5, "Numéro de carte VTC invalide"),
  vtc_card_expiry_date: z.string().min(1, "Date d'expiration de la carte VTC requise"),
  // Assurance optionnelle
  insurance_number: z.string().optional(),
  insurance_expiry_date: z.string().optional(),
})

interface FormData {
  first_name: string
  last_name: string
  phone: string
  company_name: string
  company_phone: string
  employee_name?: string  // Optionnel
  employee_phone?: string  // Optionnel
  driving_license_number: string
  driving_license_expiry_date: string
  vtc_card_number: string
  vtc_card_expiry_date: string
  insurance_number?: string  // Optionnel
  insurance_expiry_date?: string  // Optionnel
}

interface ModernDriverProfileSetupProps {
  userId: string
}

export default function ModernDriverProfileSetup({ userId }: ModernDriverProfileSetupProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [allowStepValidation, setAllowStepValidation] = useState(false) // Flag pour contrôler la validation

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    phone: "",
    company_name: "",
    company_phone: "",
    employee_name: "",  // Optionnel, par défaut vide
    employee_phone: "",  // Optionnel, par défaut vide
    driving_license_number: "",
    driving_license_expiry_date: "",
    vtc_card_number: "",
    vtc_card_expiry_date: "",
    insurance_number: "",  // Optionnel, par défaut vide
    insurance_expiry_date: "",  // Optionnel, par défaut vide
  })

  // Vérifier si un profil existe déjà
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
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
          .select('id, status, driving_license_number, vtc_card_number, first_name, last_name, phone')
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
            if (existingDriver.first_name) {
              setFormData(prev => ({
                ...prev,
                first_name: existingDriver.first_name || '',
                last_name: existingDriver.last_name || '',
                phone: existingDriver.phone || ''
              }))
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
  }, [userId, router, toast])

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
    if (currentStep < 4) {
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
      if (currentStep < 4) {
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
      
      if (currentStep !== 4) {
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
    // Pour l'étape 4, pas de validation nécessaire
    if (currentStep === 4) {
      return // Déjà à la dernière étape
    }
    
    console.log('🔄 Tentative de passage à l\'étape suivante depuis l\'étape', currentStep, 'avec validation:', forceValidation)
    
    // Si la validation n'est pas forcée (navigation automatique), passer directement
    if (!forceValidation) {
      console.log('⏭️ Navigation automatique sans validation')
      setCurrentStep(prev => Math.min(prev + 1, 4))
      return
    }
    
    // Sinon, valider avant de passer
    if (validateCurrentStep()) {
      console.log('✅ Validation réussie, passage à l\'étape', currentStep + 1)
      setCurrentStep(prev => Math.min(prev + 1, 4))
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
    
    // PROTECTION STRICTE : Empêcher absolument toute soumission avant l'étape 4
    if (currentStep !== 4) {
      console.warn('🛑 SOUMISSION BLOQUÉE - Étape actuelle:', currentStep, '- Étape requise: 4')
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
    const requiredFields = ['first_name', 'phone', 'driving_license_number', 'driving_license_expiry_date', 'vtc_card_number', 'vtc_card_expiry_date', 'user_id']
    const missingFields: string[] = []
    
    // Vérifier les champs du formulaire
    if (!formData.first_name) missingFields.push('first_name')
    if (!formData.phone) missingFields.push('phone')
    if (!formData.driving_license_number) missingFields.push('driving_license_number')
    if (!formData.driving_license_expiry_date) missingFields.push('driving_license_expiry_date')
    if (!formData.vtc_card_number) missingFields.push('vtc_card_number')
    if (!formData.vtc_card_expiry_date) missingFields.push('vtc_card_expiry_date')
    if (!userId) missingFields.push('user_id')
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Champs obligatoires manquants:', missingFields)
      setErrors({ submit: `Champs obligatoires manquants: ${missingFields.join(', ')}` })
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
        first_name: formData.first_name,
        last_name: formData.last_name || formData.first_name, // fallback si pas de nom
        phone: formData.phone,
        // Champs société optionnels dans la DB mais recommandés
        company_name: formData.company_name || 'Non renseigné',
        company_phone: formData.company_phone || formData.phone, // fallback sur le téléphone personnel
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

      toast({
        title: "Profil créé avec succès !",
        description: "Votre profil chauffeur a été complété. Redirection vers le dashboard...",
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-neutral-300">Prénom</Label>
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
                <Label htmlFor="last_name" className="text-neutral-300">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Dupont"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.last_name && <p className="text-red-400 text-sm">{errors.last_name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-neutral-300">Téléphone personnel</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-sm">{errors.phone}</p>}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            {/* Note explicative */}
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-200 text-sm">
                💡 <strong>Information :</strong> Les informations employé sont optionnelles et peuvent être complétées plus tard.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-neutral-300">Nom de la société</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Élégance Mobilité"
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.company_name && <p className="text-red-400 text-sm">{errors.company_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone" className="text-neutral-300">Téléphone société</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="company_phone"
                  name="company_phone"
                  value={formData.company_phone}
                  onChange={handleChange}
                  placeholder="+33 1 23 45 67 89"
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.company_phone && <p className="text-red-400 text-sm">{errors.company_phone}</p>}
            </div>

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
                  placeholder="Jean Dupont (peut être ajouté plus tard)"
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
                  placeholder="+33 6 12 34 56 78 (peut être ajouté plus tard)"
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.employee_phone && <p className="text-red-400 text-sm">{errors.employee_phone}</p>}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driving_license_number" className="text-neutral-300">Numéro de permis de conduire</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="driving_license_number"
                  name="driving_license_number"
                  value={formData.driving_license_number}
                  onChange={handleChange}
                  placeholder="123456789012"
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.driving_license_number && <p className="text-red-400 text-sm">{errors.driving_license_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="driving_license_expiry_date" className="text-neutral-300">Date d'expiration du permis</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="driving_license_expiry_date"
                  name="driving_license_expiry_date"
                  type="date"
                  value={formData.driving_license_expiry_date}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.driving_license_expiry_date && <p className="text-red-400 text-sm">{errors.driving_license_expiry_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vtc_card_number" className="text-neutral-300">Numéro de carte VTC</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="vtc_card_number"
                  name="vtc_card_number"
                  value={formData.vtc_card_number}
                  onChange={handleChange}
                  placeholder="VTC123456789"
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.vtc_card_number && <p className="text-red-400 text-sm">{errors.vtc_card_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vtc_card_expiry_date" className="text-neutral-300">Date d'expiration carte VTC</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="vtc_card_expiry_date"
                  name="vtc_card_expiry_date"
                  type="date"
                  value={formData.vtc_card_expiry_date}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pl-10 input-elegant"
                />
              </div>
              {errors.vtc_card_expiry_date && <p className="text-red-400 text-sm">{errors.vtc_card_expiry_date}</p>}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            {/* Message informatif pour la dernière étape */}
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-200 text-sm">
                <strong>Dernière étape :</strong> Ces informations d'assurance sont optionnelles. 
                Vous pourrez les ajouter plus tard depuis votre profil.
              </p>
            </div>
            
            {/* Message de confirmation avant soumission */}
            <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
              <p className="text-green-200 text-sm">
                <strong>Prêt à créer votre profil ?</strong> Vérifiez vos informations et cliquez sur "Créer mon profil" pour finaliser votre inscription.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_number" className="text-neutral-300">Numéro d'assurance (optionnel)</Label>
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
              <Label htmlFor="insurance_expiry_date" className="text-neutral-300">Date d'expiration assurance (optionnel)</Label>
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
        )

      default:
        return null
    }
  }

  const stepTitles = [
    "Informations personnelles",
    "Informations société",
    "Permis et carte VTC",
    "Assurance (optionnel)"
  ]

  const progress = (currentStep / 4) * 100

  return (
    <div className="min-h-screen bg-neutral-950 bg-elegant-gradient py-8 px-4">
      <div className="container mx-auto max-w-md">
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
            <span>Étape {currentStep} sur 4</span>
            <span>{Math.round(progress)}% complété</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Formulaire */}
        <Card className="elegant-backdrop">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Car className="w-5 h-5 mr-2 text-blue-400" />
              {stepTitles[currentStep - 1]}
            </CardTitle>
            <CardDescription className="text-neutral-400">
              {currentStep < 4 
                ? "Renseignez vos informations - vous pourrez naviguer librement entre les étapes"
                : "Dernière étape - vérifiez vos informations avant validation"
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
                
                {currentStep < 4 ? (
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
                        Créer mon profil
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
