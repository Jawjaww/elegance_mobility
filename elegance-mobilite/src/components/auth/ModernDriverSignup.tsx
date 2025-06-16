"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ButtonLoading } from "@/components/ui/loading"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/database/client"
import { useToast } from "@/hooks/useToast"
import { Mail, User, ArrowRight, Lock, Car } from "lucide-react"

// Schéma de validation simple pour la création de compte
const signupSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

interface SignupFormData {
  first_name: string
  last_name: string
  email: string
  password: string
}

export default function ModernDriverSignup() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<SignupFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Effacer l'erreur si l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = (): boolean => {
    setErrors({})
    
    try {
      signupSchema.parse(formData)
      return true
    } catch (error: any) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      console.log('🔐 Création du compte chauffeur...')
      
      // Créer le compte utilisateur (le rôle sera automatiquement défini par le trigger PostgreSQL)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            // user_metadata : données utilisateur uniquement
            portal_type: 'driver', // Utilisé par le trigger pour définir le rôle dans app_metadata
            full_name: `${formData.first_name} ${formData.last_name}`,
            first_name: formData.first_name,
            last_name: formData.last_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email?type=email_confirmation&next=/driver-portal/profile/setup`
        }
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Cet email est déjà utilisé. Essayez de vous connecter.')
        }
        throw error
      }

      // Si pas de session, l'utilisateur doit confirmer son email
      if (data?.user && !data?.session) {
        toast({
          title: "Compte créé avec succès !",
          description: "Veuillez vérifier votre email et cliquer sur le lien de confirmation.",
        })
        router.push('/auth/verify-email?type=driver')
        return
      }

      // Si session immédiatement disponible (rare)
      if (data?.session) {
        toast({
          title: "Compte créé avec succès !",
          description: "Vous pouvez maintenant compléter votre profil chauffeur.",
        })
        router.push('/driver-portal/profile/setup')
      }

    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error)
      
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription.",
        variant: "destructive"
      })
      
      setErrors({ submit: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 bg-elegant-gradient py-8 px-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Devenir Chauffeur Partenaire</h1>
          <p className="text-neutral-400">Créez votre compte pour commencer</p>
        </div>

        {/* Étapes du processus */}
        <div className="mb-8 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <h3 className="text-blue-300 font-semibold mb-3">Processus d'inscription :</h3>
          <div className="space-y-2 text-sm text-blue-200">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">1</div>
              <span>Créer votre compte</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-neutral-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">2</div>
              <span>Confirmer votre email</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-neutral-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">3</div>
              <span>Compléter votre profil chauffeur</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-neutral-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">4</div>
              <span>Attendre la validation</span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <Card className="elegant-backdrop">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Car className="w-5 h-5 mr-2 text-blue-400" />
              Création de compte
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Renseignez vos informations de base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="email" className="text-neutral-300">Email professionnel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jean.dupont@exemple.com"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pl-10 input-elegant"
                  />
                </div>
                <p className="text-xs text-neutral-500">Minimum 8 caractères</p>
                {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient text-white"
              >
                {isLoading ? (
                  <ButtonLoading />
                ) : (
                  <span className="flex items-center gap-2 text-white">
                    Créer mon compte
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Liens de navigation */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-neutral-400 text-sm">
            Déjà un compte chauffeur ?{" "}
            <button
              onClick={() => router.push('/driver-portal/login')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Se connecter
            </button>
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-neutral-500 hover:text-neutral-400 text-sm"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}
