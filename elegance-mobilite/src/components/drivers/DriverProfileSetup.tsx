"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Using the glass sheet wrapper as the main surface; keep internal layout minimal
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  MapPin,
  Car,
  User as UserIcon,
  Upload,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";
import { PageLoading, ButtonLoading } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import DriverDocumentUploader from "./DriverDocumentUploader";

interface DriverProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  license_number: string;
  driving_license_expiry_date: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_color: string;
  vehicle_plate: string;
  address: string;
  city: string;
  postal_code: string;
  vtc_card_number: string;
  vtc_card_expiry_date: string;
  date_of_birth: string;
  insurance_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  // Additional fields for compliance / payouts
  nationality?: string;
  driving_license_issue_date?: string;
  driving_license_categories?: string;
  company_siret?: string;
  payment_provider_account_id?: string;
  terms_accepted_at?: string;
}

export default function DriverProfileSetup({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({
    driving_license: null,
    vtc_card: null,
    insurance: null,
    id_card: null,
    proof_of_address: null,
  });
  const [formData, setFormData] = useState<DriverProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    license_number: "",
    driving_license_expiry_date: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: "",
    vehicle_color: "",
    vehicle_plate: "",
    address: "",
    city: "",
    postal_code: "",
    vtc_card_number: "",
    vtc_card_expiry_date: "",
    date_of_birth: "",
    insurance_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isFromWarning = searchParams?.get("from") === "driver-setup";

  useEffect(() => {
    // Vérifier si l'email vient d'être vérifié
    const verified = searchParams?.get("verified");
    if (verified === "true") {
      setEmailVerified(true);
      toast({
        title: "Email confirmé !",
        description:
          "Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant compléter votre profil.",
      });

      // Nettoyer l'URL
      router.replace("/driver-portal/profile/setup", { scroll: false });
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        // Vérifier si le chauffeur a déjà un profil
        const { data: existingDriver, error } = await supabase
          .from("drivers")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = No rows found for .single() depending on client version; ignore
          console.error(
            "Erreur lors de la vérification du profil existant:",
            error,
          );
        }

        if (existingDriver) {
          setDriverId(existingDriver.id);

          const fromParam = searchParams?.get("from") || null;
          const forceEdit =
            fromParam === "driver-setup" || fromParam === "force_edit";

          // Si le chauffeur est déjà actif et qu'on ne force pas l'édition, rediriger vers le dashboard
          if (existingDriver.status === "active" && !forceEdit) {
            router.push("/driver-portal/dashboard");
            return;
          }

          // Pré-remplir le formulaire pour permettre la modification/completion
          setFormData((prev) => ({
            ...prev,
            first_name: existingDriver.first_name || prev.first_name,
            last_name: existingDriver.last_name || prev.last_name,
            phone: existingDriver.phone || prev.phone,
            license_number: existingDriver.driving_license_number || prev.license_number,
            driving_license_expiry_date:
              existingDriver.driving_license_expiry_date || prev.driving_license_expiry_date,
            driving_license_issue_date: existingDriver.driving_license_issue_date || prev.driving_license_issue_date,
            address: existingDriver.address_line1 || prev.address,
            city: existingDriver.city || prev.city,
            postal_code: existingDriver.postal_code || prev.postal_code,
            vtc_card_number: existingDriver.vtc_card_number || prev.vtc_card_number,
            vtc_card_expiry_date: existingDriver.vtc_card_expiry_date || prev.vtc_card_expiry_date,
            date_of_birth: existingDriver.date_of_birth || prev.date_of_birth,
            insurance_number: existingDriver.insurance_number || prev.insurance_number,
            emergency_contact_name: existingDriver.emergency_contact_name || prev.emergency_contact_name,
            emergency_contact_phone: existingDriver.emergency_contact_phone || prev.emergency_contact_phone,
            vehicle_year: existingDriver.vehicle_year ? String(existingDriver.vehicle_year) : prev.vehicle_year,
            vehicle_color: existingDriver.vehicle_color || prev.vehicle_color,
            vehicle_plate: existingDriver.vehicle_plate || prev.vehicle_plate,
            nationality: existingDriver.nationality || prev.nationality,
            company_siret: existingDriver.company_siret || prev.company_siret,
          }));

          setEditing(true);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification du profil existant:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [router, user.id, searchParams]);

  const handleInputChange = (field: keyof DriverProfileData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.first_name && formData.last_name && formData.phone);
      case 2:
        return !!(formData.license_number && formData.driving_license_expiry_date);
      case 3:
        return !!(formData.vtc_card_number && formData.vtc_card_expiry_date);
      case 4:
        return !!(formData.address && formData.city && formData.postal_code);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !validateStep(4)) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("drivers")
        .insert({
          user_id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          /* Map to actual DB columns */
          driving_license_number: formData.license_number,
          driving_license_expiry_date: formData.driving_license_expiry_date || null,
          driving_license_issue_date: formData.driving_license_issue_date || null,
          nationality: formData.nationality || null,
          driving_license_categories: formData.driving_license_categories || null,
          address_line1: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          vtc_card_number: formData.vtc_card_number || null,
          vtc_card_expiry_date: formData.vtc_card_expiry_date || null,
          date_of_birth: formData.date_of_birth || null,
          insurance_number: formData.insurance_number || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          company_siret: formData.company_siret || null,
          payment_provider_account_id: formData.payment_provider_account_id || null,
          /* Vehicle configuration is handled separately (vehicles table).
             Set driver status to pending_validation per DB enum. */
          status: "pending_validation",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Profil créé avec succès !",
        description:
          "Votre demande est en cours de validation par nos équipes.",
      });

      // Rediriger vers la page d'attente de validation
      // If we uploaded temporary documents earlier, ask the server-side function to associate them with this driver
      if (data?.id) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (token) {
            // invoke the edge function that copies tmp files to driver folder and updates DB (service role)
            const invokeRes = await supabase.functions.invoke('associate-temp-docs', {
              body: JSON.stringify({ driver_id: data.id }),
              headers: { Authorization: `Bearer ${token}` },
            });

            if (invokeRes.error) {
              console.error('associate-temp-docs error', invokeRes.error);
              // fallback: leave tmp files and continue; admin or cron job will handle cleanup
            } else {
              console.log('associate-temp-docs result', invokeRes.data);
            }
          }
        } catch (e) {
          console.error('Erreur lors de l association des fichiers temporaires via function:', e);
        }
      }

      router.push("/driver-portal/pending");
    } catch (error: any) {
      console.error("Erreur lors de la création du profil:", error);
      toast({
        title: "Erreur",
        description:
          error.message ||
          "Une erreur est survenue lors de la création de votre profil.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoading text="Vérification de votre profil..." />;
  }

  const progress = (currentStep / 4) * 100;

  const pageInner = (
    <motion.div
      className="max-w-2xl mx-auto px-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.87, 0, 0.13, 1] }}
    >
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-50 mb-2 driver-setup-title">
          Configuration de votre profil chauffeur
        </h1>
        <p className="text-slate-300/80">
          Complétez votre profil pour commencer à recevoir des demandes de
          course
        </p>
      </div>

      {/* Minimal progress row (no extra card) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold text-slate-100">
            Étape {currentStep} sur 4
          </div>
          <Badge variant="secondary">{Math.round(progress)}% complété</Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Main form area — motion animation on step change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.32, ease: [0.87, 0, 0.13, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 p-6">
            {currentStep === 1 && (
              <UserIcon className="h-5 w-5 text-slate-200" />
            )}
            {currentStep === 2 && (
              <AlertCircle className="h-5 w-5 text-slate-200" />
            )}
            {currentStep === 3 && <Car className="h-5 w-5 text-slate-200" />}
            {currentStep === 4 && <MapPin className="h-5 w-5 text-slate-200" />}
            <div>
              <div className="text-lg font-semibold text-slate-50">
                {currentStep === 1 && "Informations personnelles"}
                {currentStep === 2 && "Permis de conduire"}
                {currentStep === 3 && "Informations du véhicule"}
                {currentStep === 4 && "Adresse"}
              </div>
              <div className="text-sm text-slate-300">
                {currentStep === 1 && "Vos informations de base"}
                {currentStep === 2 && "Votre permis de conduire"}
                {currentStep === 3 && "Les détails de votre véhicule"}
                {currentStep === 4 && "Votre adresse de résidence"}
              </div>
            </div>
          </div>

          <CardContent className="pt-0 space-y-6">
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    placeholder="Votre nom"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <Label htmlFor="license_number">
                  Numéro de permis de conduire *
                </Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) =>
                    handleInputChange("license_number", e.target.value)
                  }
                  placeholder="Votre numéro de permis"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Ce numéro sera vérifié lors de la validation de votre profil
                </p>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vtc_card_number">Numéro VTC *</Label>
                  <Input
                    id="vtc_card_number"
                    value={formData.vtc_card_number}
                    onChange={(e) =>
                      handleInputChange("vtc_card_number", e.target.value)
                    }
                    placeholder="Numéro VTC"
                  />
                </div>
                <div>
                  <Label htmlFor="vtc_card_expiry_date">VTC - Date d'expiration *</Label>
                  <Input
                    id="vtc_card_expiry_date"
                    type="date"
                    value={formData.vtc_card_expiry_date}
                    onChange={(e) =>
                      handleInputChange("vtc_card_expiry_date", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="insurance_number">Numéro d'assurance</Label>
                  <Input
                    id="insurance_number"
                    value={formData.insurance_number}
                    onChange={(e) =>
                      handleInputChange("insurance_number", e.target.value)
                    }
                    placeholder="Numéro d'assurance"
                  />
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date de naissance</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      handleInputChange("date_of_birth", e.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="emergency_contact_name">Contact d'urgence - Nom</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) =>
                      handleInputChange("emergency_contact_name", e.target.value)
                    }
                    placeholder="Nom du contact"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="emergency_contact_phone">Contact d'urgence - Téléphone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) =>
                      handleInputChange("emergency_contact_phone", e.target.value)
                    }
                    placeholder="Téléphone du contact"
                  />
                </div>

                {/* Uploaders */}
                <div className="md:col-span-2">
                  <DriverDocumentUploader
                    driverId={driverId ?? ""}
                    documentType="driving_license"
                    label="Permis de conduire (recto/verso)"
                    accept="image/*,application/pdf"
                    onUploaded={(r) => console.log("uploaded license", r)}
                  />
                </div>
                <div className="md:col-span-2">
                  <DriverDocumentUploader
                    driverId={driverId ?? ""}
                    documentType="vtc_card"
                    label="Carte VTC"
                    accept="image/*,application/pdf"
                    onUploaded={(r) => console.log("uploaded vtc", r)}
                  />
                </div>
                <div className="md:col-span-2">
                  <DriverDocumentUploader
                    driverId={driverId ?? ""}
                    documentType="insurance"
                    label="Attestation d'assurance"
                    accept="image/*,application/pdf"
                    onUploaded={(r) => console.log("uploaded insurance", r)}
                  />
                </div>
                <div className="md:col-span-2">
                  <DriverDocumentUploader
                    driverId={driverId ?? ""}
                    documentType="id_card"
                    label="Pièce d'identité"
                    accept="image/*,application/pdf"
                    onUploaded={(r) => console.log("uploaded id", r)}
                  />
                </div>
                <div className="md:col-span-2">
                  <DriverDocumentUploader
                    driverId={driverId ?? ""}
                    documentType="proof_of_address"
                    label="Justificatif de domicile"
                    accept="image/*,application/pdf"
                    onUploaded={(r) => console.log("uploaded proof", r)}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="123 Rue de la Paix"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      placeholder="Paris"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) =>
                        handleInputChange("postal_code", e.target.value)
                      }
                      placeholder="75001"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Précédent
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep(4) || submitting}
                >
                  {submitting ? <ButtonLoading /> : "Créer mon profil"}
                </Button>
              )}
            </div>
          </CardContent>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6">
        <div className="flex items-center gap-3 p-4">
          <CheckCircle className="h-5 w-5 text-slate-200" />
          <div className="text-sm text-slate-300">
            Une fois votre profil soumis, nos équipes procéderont à sa
            validation. Vous recevrez une notification par email dès que votre
            compte sera activé.
          </div>
        </div>
      </div>
    </motion.div>
  );

  return pageInner;
}
