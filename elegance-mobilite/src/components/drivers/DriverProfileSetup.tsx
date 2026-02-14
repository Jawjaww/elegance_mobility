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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Building2, FileText, BarChart3, Save, Send, Check, AlertCircle } from "lucide-react";
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

export default function DriverProfileSetup({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("informations");
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

  if (loading) return <PageLoading text="Vérification..." />;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-12 lg:p-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md md:max-w-2xl lg:max-w-4xl overflow-hidden border rounded-xl md:rounded-2xl shadow-2xl backdrop-blur-3xl flex flex-col relative"
        style={{
          maxHeight: "calc(100vh - 80px)",
          width: "100%",
          borderColor: "rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 18px 60px rgba(2,6,23,0.65), 0 6px 24px rgba(70,130,180,0.06)",
          background: "linear-gradient(180deg, rgba(70,130,180,0.03), rgba(255,255,255,0.008))",
        }}
      >
        {/* Glass overlay - exactement comme FullscreenRideModal */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)), radial-gradient(1000px 120px at 10% 6%, rgba(255,255,255,0.08), rgba(255,255,255,0) 10%)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "inset 0 2px 14px rgba(255,255,255,0.02)",
            zIndex: 0,
          }}
        />
        
        {/* Content */}
        <div className="flex flex-col relative z-10 overflow-hidden">
          {/* Header */}
          <div className="px-6 md:px-10 lg:px-12 pb-5 md:pb-6 pt-6 md:pt-8 border-b border-white/[0.06]">
            <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-white mb-2">
              {isSubmitted ? "Votre profil" : "Configuration de votre profil"}
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              {isSubmitted ? "Consultez l'état de votre dossier." : "Complétez votre profil pour recevoir des courses"}
            </p>
            {isSubmitted && (
              <div className="mt-3 flex items-center gap-2 text-xs md:text-sm text-blue-300">
                <Send className="h-3 w-3 md:h-4 md:w-4" />
                <span>En attente de validation</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full justify-start bg-transparent border-b h-auto p-0 px-2 md:px-4 lg:px-6 shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {[
                { id: "informations", icon: UserIcon, label: "Infos" },
                { id: "societe", icon: Building2, label: "Société" },
                { id: "documents", icon: FileText, label: "Documents", badge: !isSubmitted ? missingDocuments.length : 0 },
                { id: "progression", icon: BarChart3, label: "Progrès" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 lg:px-5 py-3 md:py-4 text-xs md:text-sm text-slate-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 rounded-none bg-transparent border-0"
                  disabled={isReadOnly && tab.id !== "progression"}
                >
                  <tab.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>{tab.label}</span>
                  {(tab.badge || 0) > 0 && <Badge variant="destructive" className="ml-0.5 h-4 text-[10px] px-1">{tab.badge}</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-12 py-5 md:py-8">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  
                  {/* Informations */}
                  {activeTab === "informations" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "first_name", label: "Prénom *", type: "text" },
                          { id: "last_name", label: "Nom *", type: "text" },
                          { id: "phone", label: "Téléphone *", type: "tel" },
                          { id: "date_of_birth", label: "Date naissance", type: "date" },
                        ].map((field) => (
                          <div key={field.id}>
                            <Label className="text-[11px] text-slate-400 uppercase tracking-wide">{field.label}</Label>
                            <Input
                              id={field.id}
                              type={field.type}
                              value={formData[field.id as keyof DriverProfileData]}
                              onChange={(e) => handleInputChange(field.id as keyof DriverProfileData, e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-white/[0.03] border-white/10 text-white text-sm h-9 rounded-md focus:bg-white/[0.05] focus:border-white/20"
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Contact d'urgence</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] text-slate-500">Nom</Label>
                            <Input
                              id="emergency_contact_name"
                              value={formData.emergency_contact_name}
                              onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-white/[0.03] border-white/10 text-white text-sm h-9 rounded-md"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-slate-500">Téléphone</Label>
                            <Input
                              id="emergency_contact_phone"
                              value={formData.emergency_contact_phone}
                              onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-white/[0.03] border-white/10 text-white text-sm h-9 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Adresse</p>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-[11px] text-slate-400 uppercase tracking-wide">Adresse *</Label>
                            <Input
                              id="address"
                              value={formData.address}
                              onChange={(e) => handleInputChange("address", e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-white/[0.03] border-white/10 text-white text-sm h-9 rounded-md"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[11px] text-slate-400 uppercase tracking-wide">Ville *</Label>
                              <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => handleInputChange("city", e.target.value)}
                                disabled={isReadOnly}
                                className="mt-1 bg-white/[0.03] border-white/10 text-white text-sm h-9 rounded-md"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] text-slate-400 uppercase tracking-wide">Code postal *</Label>
                              <Input
                                id="postal_code"
                                value={formData.postal_code}
                                onChange={(e) => handleInputChange("postal_code", e.target.value)}
                                disabled={isReadOnly}
                                className="mt-1 bg-white/[0.03] border-white/10 text-white text-sm h-9 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Société */}
                  {activeTab === "societe" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "vtc_card_number", label: "N° carte VTC *" },
                          { id: "vtc_card_expiry_date", label: "Exp. VTC *", type: "date" },
                          { id: "license_number", label: "N° permis *" },
                          { id: "driving_license_expiry_date", label: "Exp. permis *", type: "date" },
                          { id: "insurance_number", label: "N° assurance" },
                          { id: "company_siret", label: "SIRET" },
                        ].map((field) => (
                          <div key={field.id}>
                            <Label className="text-[11px] text-slate-400 uppercase tracking-wide">{field.label}</Label>
                            <Input
                              id={field.id}
                              type={field.type || "text"}
                              value={formData[field.id as keyof DriverProfileData]}
                              onChange={(e) => handleInputChange(field.id as keyof DriverProfileData, e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-white/[0.03] border-white/10 text-white text-sm h-9 rounded-md"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {activeTab === "documents" && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-500">Formats: JPG, PNG, PDF. Max 10MB.</p>
                      <div className="space-y-1">
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
                  {activeTab === "progression" && (
                    <div className="space-y-4">
                      {/* Completion bar style FullscreenRideModal */}
                      <div className="w-full rounded-md overflow-hidden border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-300 font-medium">Progression</span>
                          <span className={`text-sm font-bold ${isProfileComplete ? "text-emerald-400" : "text-blue-400"}`}>
                            {Math.round(completionPercentage)}%
                          </span>
                        </div>
                        <Progress value={completionPercentage} className="h-1.5" />
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md border border-white/10 bg-white/[0.02] p-2">
                          <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                            <span>Infos</span>
                            <span className="text-white">{REQUIRED_FIELDS.filter(f => formData[f]?.trim()).length}/{REQUIRED_FIELDS.length}</span>
                          </div>
                          <Progress value={(REQUIRED_FIELDS.filter(f => formData[f]?.trim()).length / REQUIRED_FIELDS.length) * 100} className="h-1" />
                        </div>
                        <div className="rounded-md border border-white/10 bg-white/[0.02] p-2">
                          <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                            <span>Docs</span>
                            <span className="text-white">{REQUIRED_DOCUMENTS.filter(d => documents[d]).length}/{REQUIRED_DOCUMENTS.length}</span>
                          </div>
                          <Progress value={(REQUIRED_DOCUMENTS.filter(d => documents[d]).length / REQUIRED_DOCUMENTS.length) * 100} className="h-1" />
                        </div>
                      </div>

                      {/* Missing documents alert */}
                      {missingDocuments.length > 0 && (
                        <div className="rounded-md border border-[#f9c2c2]/30 overflow-hidden">
                          <div 
                            className="px-3 py-2 flex items-center gap-2"
                            style={{ background: "linear-gradient(90deg, rgba(247, 211, 211, 0.15) 0%, rgba(247, 211, 211, 0.05) 100%)" }}
                          >
                            <AlertCircle className="h-4 w-4 text-[#f87171]" />
                            <span className="text-xs text-[#fca5a5] font-medium">{missingDocuments.length} document(s) manquant(s)</span>
                          </div>
                          <div className="px-3 py-2 space-y-1">
                            {missingDocuments.map((doc) => (
                              <div
                                key={doc}
                                className="flex items-center justify-between py-1 cursor-pointer text-slate-400 hover:text-white transition-colors"
                                onClick={() => setActiveTab("documents")}
                              >
                                <span className="text-xs">{DOC_LABELS[doc]}</span>
                                <span className="text-[10px] text-[#f87171]">Ajouter</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Document list */}
                      <div className="rounded-md border border-white/10 overflow-hidden">
                        <div className="px-3 py-2 border-b border-white/10 bg-white/[0.02]">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Documents requis</span>
                        </div>
                        <div className="divide-y divide-white/5">
                          {REQUIRED_DOCUMENTS.map((doc) => (
                            <div
                              key={doc}
                              className="px-3 py-2 flex items-center justify-between"
                            >
                              <span className={documents[doc] ? "text-xs text-emerald-300" : "text-xs text-slate-400"}>{DOC_LABELS[doc]}</span>
                              {documents[doc] && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={handleSaveProgress} disabled={saving || !driverId || isSubmitted}
                          className="flex-1 border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white h-9 text-xs">
                          {saving ? <ButtonLoading /> : <><Save className="h-3.5 w-3.5 mr-1.5" /> Sauver</>}
                        </Button>
                        {isProfileComplete && driverId && !isSubmitted && (
                          <Button size="sm" onClick={handleSubmitForReview} disabled={submitting}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs">
                            {submitting ? <ButtonLoading /> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Soumettre</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
