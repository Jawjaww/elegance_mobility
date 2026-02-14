"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save, Send, Check, AlertCircle, User as UserIcon, Briefcase, FileText, Shield } from "lucide-react";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";
import { PageLoading, ButtonLoading } from "@/components/ui/loading";
import DriverDocumentUploader from "./DriverDocumentUploader";

interface DriverProfileData {
  first_name: string; last_name: string; phone: string; date_of_birth: string;
  emergency_contact_name: string; emergency_contact_phone: string;
  license_number: string; driving_license_expiry_date: string;
  vtc_card_number: string; vtc_card_expiry_date: string;
  insurance_number: string; company_siret: string;
  address: string; city: string; postal_code: string;
}

interface DocumentStatus {
  driving_license: boolean; vtc_card: boolean; insurance: boolean;
  id_card: boolean; proof_of_address: boolean;
}

const REQUIRED_FIELDS: (keyof DriverProfileData)[] = [
  'first_name', 'last_name', 'phone', 'vtc_card_number', 'vtc_card_expiry_date',
  'license_number', 'driving_license_expiry_date', 'address', 'city', 'postal_code'
];

const REQUIRED_DOCUMENTS: (keyof DocumentStatus)[] = [
  'driving_license', 'vtc_card', 'insurance', 'id_card', 'proof_of_address'
];

const DOC_LABELS: Record<keyof DocumentStatus, string> = {
  driving_license: "Permis de conduire", vtc_card: "Carte VTC",
  insurance: "Attestation d'assurance", id_card: "Pièce d'identité", 
  proof_of_address: "Justificatif de domicile",
};

export const SECTIONS = [
  { id: "profil", icon: UserIcon, label: "Profil", description: "Informations personnelles" },
  { id: "professionnel", icon: Briefcase, label: "Professionnel", description: "Cartes et autorisations" },
  { id: "documents", icon: FileText, label: "Documents", description: "Justificatifs à fournir" },
  { id: "validation", icon: Shield, label: "Validation", description: "Vérification et envoi" },
];

interface DriverProfileSetupProps {
  user: User;
  currentSection: number;
  onSectionChange: (section: number) => void;
}

export default function DriverProfileSetup({ user, currentSection, onSectionChange }: DriverProfileSetupProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string>('draft');
  const [documents, setDocuments] = useState<DocumentStatus>({
    driving_license: false, vtc_card: false, insurance: false, id_card: false, proof_of_address: false,
  });
  const [formData, setFormData] = useState<DriverProfileData>({
    first_name: "", last_name: "", phone: "", date_of_birth: "", emergency_contact_name: "",
    emergency_contact_phone: "", license_number: "", driving_license_expiry_date: "",
    vtc_card_number: "", vtc_card_expiry_date: "", insurance_number: "", company_siret: "",
    address: "", city: "", postal_code: "",
  });

  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { data: existingDriver, error } = await supabase
          .from("drivers").select("*").eq("user_id", user.id).single();

        if (error && error.code !== "PGRST116") console.error("Error:", error);

        if (existingDriver) {
          setDriverId(existingDriver.id);
          if (existingDriver.status === "active" && searchParams?.get("from") !== "driver-setup") {
            router.push("/driver-portal/dashboard"); return;
          }
          setFormData({
            first_name: existingDriver.first_name || "", last_name: existingDriver.last_name || "",
            phone: existingDriver.phone || "", date_of_birth: existingDriver.date_of_birth || "",
            emergency_contact_name: existingDriver.emergency_contact_name || "",
            emergency_contact_phone: existingDriver.emergency_contact_phone || "",
            license_number: existingDriver.driving_license_number || "",
            driving_license_expiry_date: existingDriver.driving_license_expiry_date || "",
            vtc_card_number: existingDriver.vtc_card_number || "",
            vtc_card_expiry_date: existingDriver.vtc_card_expiry_date || "",
            insurance_number: existingDriver.insurance_number || "",
            company_siret: existingDriver.company_siret || "",
            address: existingDriver.address_line1 || "", city: existingDriver.city || "",
            postal_code: existingDriver.postal_code || "",
          });
          if ((existingDriver as any).submission_status) {
            setSubmissionStatus((existingDriver as any).submission_status);
          }
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    checkExistingProfile();
  }, [router, user.id, searchParams]);

  useEffect(() => {
    const checkDocuments = async () => {
      if (!driverId) return;
      try {
        const { data: docs, error } = await supabase
          .from("driver_documents").select("document_type, validation_status")
          .eq("driver_id", driverId).eq("validation_status", "approved");
        if (!error && docs) {
          const docTypes = docs.map(d => d.document_type);
          setDocuments({
            driving_license: docTypes.includes("driving_license"),
            vtc_card: docTypes.includes("vtc_card"),
            insurance: docTypes.includes("insurance"),
            id_card: docTypes.includes("id_card") || docTypes.includes("passport"),
            proof_of_address: docTypes.includes("proof_of_address"),
          });
        }
      } catch (err) { console.error("Error:", err); }
    };
    checkDocuments();
  }, [driverId]);

  const calculateCompletion = useCallback((): number => {
    const filledFields = REQUIRED_FIELDS.filter(f => formData[f]?.trim() !== "").length;
    const filledDocs = REQUIRED_DOCUMENTS.filter(d => documents[d]).length;
    return Math.min(100, (filledFields / REQUIRED_FIELDS.length) * 50 + (filledDocs / REQUIRED_DOCUMENTS.length) * 50);
  }, [formData, documents]);

  const completionPercentage = calculateCompletion();
  const isProfileComplete = completionPercentage >= 95;
  const isSubmitted = submissionStatus === "pending_review";
  const isReadOnly = isSubmitted;
  const missingDocuments = REQUIRED_DOCUMENTS.filter(doc => !documents[doc]);

  const handleInputChange = (field: keyof DriverProfileData, value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProgress = async () => {
    if (!driverId) { toast({ title: "Erreur", description: "Aucun profil trouvé", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("drivers").update({ submission_status: 'draft', updated_at: new Date().toISOString() }).eq("id", driverId);
      if (error) throw error;
      toast({ title: "Progression sauvegardée", description: "Vous pouvez reprendre plus tard." });
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleSubmitForReview = async () => {
    if (!driverId || !isProfileComplete) {
      toast({ title: "Profil incomplet", description: "Complétez tous les champs et documents.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("drivers").update({
        submission_status: 'pending_review', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }).eq("id", driverId);
      if (error) throw error;
      setSubmissionStatus('pending_review');
      toast({ title: "Profil soumis", description: "Nos équipes vont examiner votre dossier." });
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const nextSection = () => {
    if (currentSection < SECTIONS.length - 1) onSectionChange(currentSection + 1);
  };

  const prevSection = () => {
    if (currentSection > 0) onSectionChange(currentSection - 1);
  };

  const canProceed = () => {
    if (currentSection === 0) {
      return formData.first_name && formData.last_name && formData.phone && formData.address && formData.city && formData.postal_code;
    }
    if (currentSection === 1) {
      return formData.vtc_card_number && formData.vtc_card_expiry_date && formData.license_number && formData.driving_license_expiry_date;
    }
    return true;
  };

  const CurrentIcon = SECTIONS[currentSection].icon;

  if (loading) return <PageLoading text="Vérification..." />;

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-center py-8 px-4">
        <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1.5 border border-white/5">
          {SECTIONS.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(idx)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                idx === currentSection
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <section.icon className="h-4 w-4" />
              <span>{section.label}</span>
              {idx < currentSection && (
                <Check className="h-3.5 w-3.5 text-emerald-400 ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-start md:items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl"
        >
          {/* Glass Card */}
          <div
            className="rounded-2xl md:rounded-3xl border overflow-hidden relative"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "linear-gradient(145deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.8) 100%)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Inner gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,160,255,0.1), transparent)",
              }}
            />

            <div className="relative p-6 md:p-10 lg:p-12">
              {/* Desktop Section Title */}
              <div className="hidden md:block mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <CurrentIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-white">{SECTIONS[currentSection].label}</h1>
                    <p className="text-sm text-slate-400">{SECTIONS[currentSection].description}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Profil */}
                  {currentSection === 0 && (
                    <div className="space-y-6">
                      <div className="space-y-5">
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">
                            Prénom <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            value={formData.first_name}
                            onChange={(e) => handleInputChange("first_name", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                            placeholder="Votre prénom"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">
                            Nom <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            value={formData.last_name}
                            onChange={(e) => handleInputChange("last_name", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                            placeholder="Votre nom"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">
                            Téléphone <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">Date de naissance</Label>
                          <Input
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                          />
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-white/5">
                        <h3 className="text-sm font-medium text-white mb-4">Adresse</h3>
                        <div className="space-y-5">
                          <div>
                            <Label className="text-sm text-slate-300 mb-2 block">
                              Adresse complète <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              value={formData.address}
                              onChange={(e) => handleInputChange("address", e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                              placeholder="123 Rue de la Paix"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-slate-300 mb-2 block">
                                Ville <span className="text-red-400">*</span>
                              </Label>
                              <Input
                                value={formData.city}
                                onChange={(e) => handleInputChange("city", e.target.value)}
                                disabled={isReadOnly}
                                className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                                placeholder="Paris"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-slate-300 mb-2 block">
                                Code postal <span className="text-red-400">*</span>
                              </Label>
                              <Input
                                value={formData.postal_code}
                                onChange={(e) => handleInputChange("postal_code", e.target.value)}
                                disabled={isReadOnly}
                                className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                                placeholder="75001"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <h3 className="text-sm font-medium text-white mb-4">Contact d'urgence</h3>
                        <div className="space-y-5">
                          <div>
                            <Label className="text-sm text-slate-300 mb-2 block">Nom du contact</Label>
                            <Input
                              value={formData.emergency_contact_name}
                              onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                              placeholder="Nom complet"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-slate-300 mb-2 block">Téléphone</Label>
                            <Input
                              type="tel"
                              value={formData.emergency_contact_phone}
                              onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                              placeholder="+33 6..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Professionnel */}
                  {currentSection === 1 && (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-6">
                        <p className="text-sm text-blue-200">
                          Ces informations sont nécessaires pour vérifier votre autorisation d'exercer en tant que chauffeur VTC.
                        </p>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">
                            Numéro de carte VTC <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            value={formData.vtc_card_number}
                            onChange={(e) => handleInputChange("vtc_card_number", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                            placeholder="Numéro de carte professionnelle"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">
                            Date d'expiration VTC <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={formData.vtc_card_expiry_date}
                            onChange={(e) => handleInputChange("vtc_card_expiry_date", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">
                            Numéro de permis <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            value={formData.license_number}
                            onChange={(e) => handleInputChange("license_number", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                            placeholder="Numéro de permis de conduire"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">
                            Date d'expiration permis <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={formData.driving_license_expiry_date}
                            onChange={(e) => handleInputChange("driving_license_expiry_date", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">Numéro d'assurance</Label>
                          <Input
                            value={formData.insurance_number}
                            onChange={(e) => handleInputChange("insurance_number", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                            placeholder="Numéro de contrat d'assurance"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">SIRET (optionnel)</Label>
                          <Input
                            value={formData.company_siret}
                            onChange={(e) => handleInputChange("company_siret", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl focus:bg-white/10 focus:border-blue-500/50"
                            placeholder="Si vous êtes en société"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {currentSection === 2 && (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <p className="text-sm text-amber-200">
                          Veuillez télécharger les documents demandés. Formats acceptés : JPG, PNG, PDF. Taille maximale : 10 Mo par fichier.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {REQUIRED_DOCUMENTS.map((docType) => (
                          <DriverDocumentUploader
                            key={docType}
                            driverId={driverId || ""}
                            documentType={docType}
                            label={DOC_LABELS[docType]}
                            accept="image/*,application/pdf"
                            onUploaded={() => driverId && setTimeout(() => window.location.reload(), 1000)}
                          />
                        ))}
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>Les documents sont vérifiés sous 24-48h ouvrées</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation */}
                  {currentSection === 3 && (
                    <div className="space-y-6">
                      {/* Progress Overview */}
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-base text-white font-medium">Avancement</span>
                          <span className={`text-2xl font-bold ${isProfileComplete ? "text-emerald-400" : "text-blue-400"}`}>
                            {Math.round(completionPercentage)}%
                          </span>
                        </div>
                        <Progress value={completionPercentage} className="h-2.5" />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <UserIcon className="h-4 w-4 text-blue-400" />
                            <span className="text-xs text-slate-400">Profil</span>
                          </div>
                          <p className="text-2xl font-semibold text-white">
                            {REQUIRED_FIELDS.filter(f => formData[f]?.trim()).length}/{REQUIRED_FIELDS.length}
                          </p>
                          <p className="text-xs text-slate-500">champs complétés</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-amber-400" />
                            <span className="text-xs text-slate-400">Documents</span>
                          </div>
                          <p className="text-2xl font-semibold text-white">
                            {REQUIRED_DOCUMENTS.filter(d => documents[d]).length}/{REQUIRED_DOCUMENTS.length}
                          </p>
                          <p className="text-xs text-slate-500">fichiers reçus</p>
                        </div>
                      </div>

                      {/* Missing Documents Alert */}
                      {missingDocuments.length > 0 && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-300">Documents manquants</span>
                          </div>
                          <div className="space-y-2">
                            {missingDocuments.map((doc) => (
                              <div
                                key={doc}
                                className="flex items-center justify-between py-1 cursor-pointer hover:text-amber-300 transition-colors"
                                onClick={() => onSectionChange(2)}
                              >
                                <span className="text-sm text-slate-300">{DOC_LABELS[doc]}</span>
                                <ChevronRight className="h-4 w-4 text-amber-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Success State */}
                      {isProfileComplete && !isSubmitted && (
                        <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-full bg-emerald-500/20">
                              <Check className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-emerald-300">Profil complet</p>
                              <p className="text-xs text-emerald-400/80">Vous pouvez maintenant soumettre votre dossier</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submitted State */}
                      {isSubmitted && (
                        <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-500/20">
                              <Send className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-300">Dossier envoyé</p>
                              <p className="text-xs text-blue-400/80">En cours de validation par notre équipe</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={handleSaveProgress}
                          disabled={saving || !driverId || isSubmitted}
                          className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 h-12 rounded-xl"
                        >
                          {saving ? <ButtonLoading /> : <><Save className="h-4 w-4 mr-2" /> Sauvegarder la progression</>}
                        </Button>
                        
                        {isProfileComplete && driverId && !isSubmitted && (
                          <Button
                            onClick={handleSubmitForReview}
                            disabled={submitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-medium"
                          >
                            {submitting ? <ButtonLoading /> : <><Send className="h-4 w-4 mr-2" /> Soumettre pour validation</>}
                          </Button>
                        )}
                        
                        {!isProfileComplete && !isSubmitted && (
                          <Button
                            disabled
                            className="w-full bg-white/5 text-slate-500 h-12 rounded-xl cursor-not-allowed"
                          >
                            Complétez toutes les sections pour soumettre
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Mobile Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5 md:hidden">
                <Button
                  variant="ghost"
                  onClick={prevSection}
                  disabled={currentSection === 0}
                  className="text-white disabled:text-slate-600 h-12 px-4"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Retour
                </Button>
                
                <Button
                  onClick={nextSection}
                  disabled={currentSection === SECTIONS.length - 1 || !canProceed()}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-white/10 h-12 px-6 rounded-xl"
                >
                  {currentSection === SECTIONS.length - 2 ? "Vérifier" : "Continuer"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
