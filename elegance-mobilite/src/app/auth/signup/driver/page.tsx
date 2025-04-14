"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useDriverSignup, type DriverSignupData } from "@/hooks/useDriverSignup"

// Schéma de validation Zod
const driverSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().regex(/^[0-9+\s()-]+$/, "Numéro de téléphone invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  vtc_card_number: z.string().min(1, "Numéro de carte VTC requis"),
  driving_license_number: z.string().min(1, "Numéro de permis requis"),
  vtc_card_expiry_date: z.string().min(1, "Date d'expiration de la carte VTC requise"),
  driving_license_expiry_date: z.string().min(1, "Date d'expiration du permis requise")
})

export default function DriverSignup() {
  const router = useRouter()
  const { signup, isLoading } = useDriverSignup()
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<DriverSignupData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    vtc_card_number: "",
    driving_license_number: "",
    vtc_card_expiry_date: "",
    driving_license_expiry_date: "",
    insurance_number: "",
    insurance_expiry_date: "",
    company_name: "",
    company_phone: "",
    languages_spoken: [],
    preferred_zones: []
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // Validation des données
      driverSchema.parse(formData)

      const result = await signup(formData)

      if (result.success) {
        router.push("/driver-portal/pending")
      } else {
        setError(result.error || "Une erreur est survenue")
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message)
      } else {
        setError(error.message || "Une erreur est survenue")
      }
    }
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
        <h1 className="text-2xl font-bold mb-6">Devenir Chauffeur</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Jean"
                required
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Dupont"
                required
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jean.dupont@chauffeur.fr"
              required
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+33600000000"
              required
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="bg-neutral-800 border-neutral-700"
            />
            <p className="text-xs text-neutral-400">
              Minimum 8 caractères
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vtc_card_number">Numéro de carte VTC</Label>
            <Input
              id="vtc_card_number"
              name="vtc_card_number"
              value={formData.vtc_card_number}
              onChange={handleChange}
              placeholder="VTC-12345"
              required
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vtc_card_expiry_date">Date d'expiration carte VTC</Label>
            <Input
              id="vtc_card_expiry_date"
              name="vtc_card_expiry_date"
              type="date"
              value={formData.vtc_card_expiry_date}
              onChange={handleChange}
              required
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driving_license_number">Numéro de permis</Label>
            <Input
              id="driving_license_number"
              name="driving_license_number"
              value={formData.driving_license_number}
              onChange={handleChange}
              placeholder="12AB34567"
              required
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driving_license_expiry_date">Date d'expiration permis</Label>
            <Input
              id="driving_license_expiry_date"
              name="driving_license_expiry_date"
              type="date"
              value={formData.driving_license_expiry_date}
              onChange={handleChange}
              required
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          {/* Champs optionnels */}
          <div className="space-y-2">
            <Label htmlFor="insurance_number">Numéro d'assurance (optionnel)</Label>
            <Input
              id="insurance_number"
              name="insurance_number"
              value={formData.insurance_number}
              onChange={handleChange}
              placeholder="ASS-12345"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insurance_expiry_date">Date d'expiration assurance</Label>
            <Input
              id="insurance_expiry_date"
              name="insurance_expiry_date"
              type="date"
              value={formData.insurance_expiry_date}
              onChange={handleChange}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          {/* Champs entreprise */}
          <div className="space-y-2">
            <Label htmlFor="company_name">Nom de l'entreprise (optionnel)</Label>
            <Input
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="VTC Services SARL"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_phone">Téléphone entreprise (optionnel)</Label>
            <Input
              id="company_phone"
              name="company_phone"
              type="tel"
              value={formData.company_phone}
              onChange={handleChange}
              placeholder="+33100000000"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm p-2 bg-red-500/10 rounded-md">
              {error}
            </p>
          )}

          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "S'inscrire comme chauffeur"}
          </Button>
        </form>
      </div>
    </div>
  )
}