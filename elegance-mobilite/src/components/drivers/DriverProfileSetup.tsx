"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save, Send, Check, AlertCircle, User as UserIcon, Building2, FileText, BarChart3 } from "lucide-react";
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
  insurance: "Assurance", id_card: "Pièce identité", proof_of_address: "Justificatif domicile",
};

const SECTIONS = [
  { id: "informations", icon: UserIcon, label: "Informations" },
  { id: "societe", icon: Building2, label: "Société" },
  { id: "documents", icon: FileText, label: "Documents" },
  { id: "progression", icon: BarChart3, label: "Progrès" },
];

export default function DriverProfileSetup({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
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
    if (currentSection < SECTIONS.length - 1) setCurrentSection(curr => curr + 1);
  };

  const prevSection = () => {
    if (currentSection > 0) setCurrentSection(curr => curr - 1);
  };

  const CurrentIcon = SECTIONS[currentSection].icon;

  if (loading) return <PageLoading text="Vérification..." />;

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header avec stepper - visible sur mobile */}
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 px-4 py-4 md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">{SECTIONS[currentSection].label}</span>
          </div>
          <span className="text-xs text-slate-400">{currentSection + 1}/{SECTIONS.length}</span>
        </div>
        <div className="flex gap-1">
          {SECTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx <= currentSection ? "bg-blue-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-center pt-8 pb-6 px-4">
        <div className="flex items-center gap-2">
          {SECTIONS.map((section, idx) => (
            <React.Fragment key={section.id}>
              <button
                onClick={() => setCurrentSection(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  idx === currentSection
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <section.icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
              {idx < SECTIONS.length - 1 && (
                <div className="w-8 h-px bg-white/10" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12">
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
              borderColor: "rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(30,41,59,0.4), rgba(15,23,42,0.6))",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
            }}
          >
            {/* Inner glow */}
            <div
              className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.03), transparent)",
              }}
            />

            <div className="relative p-6 md:p-10 lg:p-12">
              {/* Title */}
              <div className="mb-8 md:mb-10">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-2">
                  {isSubmitted ? "Votre profil" : "Configuration de votre profil"}
                </h1>
                <p className="text-sm md:text-base text-slate-400">
                  {isSubmitted ? "Consultez l'état de votre dossier." : "Complétez votre profil pour recevoir des courses"}
                </p>
                {isSubmitted && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-300">
                    <Send className="h-4 w-4" />
                    <span>En attente de validation</span>
                  </div>
                )}
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
                  {/* Informations */}
                  {currentSection === 0 && (
                    <div className="space-y-5 md:space-y-6">
                      <div className="space-y-4 md:space-y-5">
                        {[
                          { id: "first_name", label: "Prénom", required: true },
                          { id: "last_name", label: "Nom", required: true },
                          { id: "phone", label: "Téléphone", required: true, type: "tel" },
                          { id: "date_of_birth", label: "Date de naissance", type: "date" },
                        ].map((field) => (
                          <div key={field.id}>
                            <Label className="text-sm text-slate-300 mb-2 block">
                              {field.label}
                              {field.required && <span className="text-red-400 ml-1">*</span>}
                            </Label>
                            <Input
                              id={field.id}
                              type={field.type || "text"}
                              value={formData[field.id as keyof DriverProfileData]}
                              onChange={(e) => handleInputChange(field.id as keyof DriverProfileData, e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-white/5 border-white/10 text-white h-11 md:h-12 rounded-lg focus:bg-white/10 focus:border-white/20"
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-sm text-slate-400 mb-4">Contact d'urgence</p>
                        <div className="space-y-4 md:space-y-5">
                          <div>
                            <Label className="text-sm text-slate-300 mb-2 block">Nom du contact</Label>
                            <Input
                              id="emergency_contact_name"
                              value={formData.emergency_contact_name}
                              onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-white/5 border-white/10 text-white h-11 md:h-12 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-slate-300 mb-2 block">Téléphone</Label>
                            <Input
                              id="emergency_contact_phone"
                              type="tel"
                              value={formData.emergency_contact_phone}
                              onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-white/5 border-white/10 text-white h-11 md:h-12 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-sm text-slate-400 mb-4">Adresse</p>
                        <div className="space-y-4 md:space-y-5">
                          <div>
                            <Label className="text-sm text-slate-300 mb-2 block">
                              Adresse <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="address"
                              value={formData.address}
                              onChange={(e) => handleInputChange("address", e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-white/5 border-white/10 text-white h-11 md:h-12 rounded-lg"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 md:gap-5">
                            <div>
                              <Label className="text-sm text-slate-300 mb-2 block">
                                Ville <span className="text-red-400">*</span>
                              </Label>
                              <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => handleInputChange("city", e.target.value)}
                                disabled={isReadOnly}
                                className="w-full bg-white/5 border-white/10 text-white h-11 md:h-12 rounded-lg"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-slate-300 mb-2 block">
                                Code postal <span className="text-red-400">*</span>
                              </Label>
                              <Input
                                id="postal_code"
                                value={formData.postal_code}
                                onChange={(e) => handleInputChange("postal_code", e.target.value)}
                                disabled={isReadOnly}
                                className="w-full bg-white/5 border-white/10 text-white h-11 md:h-12 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Société */}
                  {currentSection === 1 && (
                    <div className="space-y-5 md:space-y-6">
                      {[
                        { id: "vtc_card_number", label: "Numéro de carte VTC", required: true },
                        { id: "vtc_card_expiry_date", label: "Expiration VTC", required: true, type: "date" },
                        { id: "license_number", label: "Numéro de permis", required: true },
                        { id: "driving_license_expiry_date", label: "Expiration permis", required: true, type: "date" },
                        { id: "insurance_number", label: "Numéro d'assurance" },
                        { id: "company_siret", label: "SIRET (optionnel)" },
                      ].map((field) => (
                        <div key={field.id}>
                          <Label className="text-sm text-slate-300 mb-2 block">
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </Label>
                          <Input
                            id={field.id}
                            type={field.type || "text"}
                            value={formData[field.id as keyof DriverProfileData]}
                            onChange={(e) => handleInputChange(field.id as keyof DriverProfileData, e.target.value)}
                            disabled={isReadOnly}
                            className="w-full bg-white/5 border-white/10 text-white h-11 md:h-12 rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documents */}
                  {currentSection === 2 && (
                    <div className="space-y-5 md:space-y-6">
                      <p className="text-sm text-slate-400">
                        Formats acceptés: JPG, PNG, WebP, PDF. Taille max: 10MB.
                      </p>
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
                    </div>
                  )}

                  {/* Progression */}
                  {currentSection === 3 && (
                    <div className="space-y-6 md:space-y-8">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-base text-white">Progression</span>
                          <span className={`text-xl font-bold ${isProfileComplete ? "text-emerald-400" : "text-blue-400"}`}>
                            {Math.round(completionPercentage)}%
                          </span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${completionPercentage}%`,
                              background: isProfileComplete
                                ? "linear-gradient(90deg, #10b981, #34d399)"
                                : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-xs text-slate-400 mb-1">Informations</p>
                          <p className="text-lg font-semibold text-white">
                            {REQUIRED_FIELDS.filter(f => formData[f]?.trim()).length}/{REQUIRED_FIELDS.length}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-xs text-slate-400 mb-1">Documents</p>
                          <p className="text-lg font-semibold text-white">
                            {REQUIRED_DOCUMENTS.filter(d => documents[d]).length}/{REQUIRED_DOCUMENTS.length}
                          </p>
                        </div>
                      </div>

                      {missingDocuments.length > 0 && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <p className="text-sm text-amber-300 mb-3">Documents manquants</p>
                          <div className="space-y-2">
                            {missingDocuments.map((doc) => (
                              <div
                                key={doc}
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => setCurrentSection(2)}
                              >
                                <span className="text-sm text-slate-300">{DOC_LABELS[doc]}</span>
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          onClick={handleSaveProgress}
                          disabled={saving || !driverId || isSubmitted}
                          className="flex-1 min-w-[120px] border-white/10 bg-white/5 text-white hover:bg-white/10 h-11"
                        >
                          {saving ? <ButtonLoading /> : <><Save className="h-4 w-4 mr-2" /> Sauvegarder</>}
                        </Button>
                        {isProfileComplete && driverId && !isSubmitted && (
                          <Button
                            onClick={handleSubmitForReview}
                            disabled={submitting}
                            className="flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                          >
                            {submitting ? <ButtonLoading /> : <><Send className="h-4 w-4 mr-2" /> Soumettre</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center justify-between mt-6 md:hidden">
            <Button
              variant="ghost"
              onClick={prevSection}
              disabled={currentSection === 0}
              className="text-white disabled:text-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={nextSection}
              disabled={currentSection === SECTIONS.length - 1}
              className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 px-6"
            >
              Suivant <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
