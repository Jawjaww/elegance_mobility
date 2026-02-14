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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Building2, FileText, BarChart3, Save, Send, Check, AlertCircle, Upload } from "lucide-react";
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
    <div className="min-h-screen w-full p-4 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          className="w-full overflow-hidden border rounded-2xl shadow-2xl backdrop-blur-3xl relative"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 18px 60px rgba(2,6,23,0.65), 0 6px 24px rgba(70,130,180,0.06)",
            background: "linear-gradient(180deg, rgba(70,130,180,0.03), rgba(255,255,255,0.008))",
          }}
        >
          {/* Glass overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
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
          <div className="relative z-10">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
              <h1 className="text-lg font-semibold text-white mb-0.5">
                {isSubmitted ? "Votre profil" : "Configuration de votre profil"}
              </h1>
              <p className="text-xs text-slate-400">
                {isSubmitted ? "Consultez l'état de votre dossier." : "Complétez votre profil pour recevoir des courses"}
              </p>
              {isSubmitted && (
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-300">
                  <Send className="h-3 w-3" />
                  <span>En attente de validation</span>
                </div>
              )}
            </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b h-auto p-0 px-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {[
                { id: "informations", icon: UserIcon, label: "Infos" },
                { id: "societe", icon: Building2, label: "Société" },
                { id: "documents", icon: FileText, label: "Documents", badge: !isSubmitted ? missingDocuments.length : 0 },
                { id: "progression", icon: BarChart3, label: "Progrès" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-1.5 px-3 py-3 text-xs text-slate-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 rounded-none bg-transparent border-0"
                  disabled={isReadOnly && tab.id !== "progression"}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {(tab.badge || 0) > 0 && <Badge variant="destructive" className="ml-0.5 h-4 text-[10px] px-1">{tab.badge}</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  
                  {/* Informations */}
                  {activeTab === "informations" && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: "first_name", label: "Prénom *", type: "text" },
                          { id: "last_name", label: "Nom *", type: "text" },
                          { id: "phone", label: "Téléphone *", type: "tel" },
                          { id: "date_of_birth", label: "Date naissance", type: "date" },
                        ].map((field) => (
                          <div key={field.id}>
                            <Label className="text-xs text-slate-400">{field.label}</Label>
                            <Input
                              id={field.id}
                              type={field.type}
                              value={formData[field.id as keyof DriverProfileData]}
                              onChange={(e) => handleInputChange(field.id as keyof DriverProfileData, e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-transparent border-white/10 text-white text-sm h-8 focus:border-white/20"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="pt-4">
                        <p className="text-xs text-slate-500 mb-3">Contact d'urgence</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-slate-500">Nom</Label>
                            <Input
                              id="emergency_contact_name"
                              value={formData.emergency_contact_name}
                              onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-transparent border-white/10 text-white text-sm h-8 focus:border-white/20"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Téléphone</Label>
                            <Input
                              id="emergency_contact_phone"
                              value={formData.emergency_contact_phone}
                              onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-transparent border-white/10 text-white text-sm h-8 focus:border-white/20"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="pt-4">
                        <p className="text-xs text-slate-500 mb-3">Adresse</p>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-slate-400">Adresse *</Label>
                            <Input
                              id="address"
                              value={formData.address}
                              onChange={(e) => handleInputChange("address", e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-transparent border-white/10 text-white text-sm h-8 focus:border-white/20"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-slate-400">Ville *</Label>
                              <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => handleInputChange("city", e.target.value)}
                                disabled={isReadOnly}
                                className="mt-1 bg-transparent border-white/10 text-white text-sm h-8 focus:border-white/20"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-slate-400">Code postal *</Label>
                              <Input
                                id="postal_code"
                                value={formData.postal_code}
                                onChange={(e) => handleInputChange("postal_code", e.target.value)}
                                disabled={isReadOnly}
                                className="mt-1 bg-transparent border-white/10 text-white text-sm h-8 focus:border-white/20"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Société */}
                  {activeTab === "societe" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: "vtc_card_number", label: "N° carte VTC *" },
                          { id: "vtc_card_expiry_date", label: "Exp. VTC *", type: "date" },
                          { id: "license_number", label: "N° permis *" },
                          { id: "driving_license_expiry_date", label: "Exp. permis *", type: "date" },
                          { id: "insurance_number", label: "N° assurance" },
                          { id: "company_siret", label: "SIRET" },
                        ].map((field) => (
                          <div key={field.id}>
                            <Label className="text-xs text-slate-400">{field.label}</Label>
                            <Input
                              id={field.id}
                              type={field.type || "text"}
                              value={formData[field.id as keyof DriverProfileData]}
                              onChange={(e) => handleInputChange(field.id as keyof DriverProfileData, e.target.value)}
                              disabled={isReadOnly}
                              className="mt-1 bg-transparent border-white/10 text-white text-sm h-8 focus:border-white/20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {activeTab === "documents" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500">Formats: JPG, PNG, PDF. Max 10MB.</p>
                      <div className="space-y-3">
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
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-300">Complétion</span>
                          <Badge className={isProfileComplete ? "bg-green-500/80" : "bg-blue-500/80"}>
                            {Math.round(completionPercentage)}%
                          </Badge>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="flex justify-between mb-1 text-slate-400">
                            <span>Infos</span>
                            <span>{REQUIRED_FIELDS.filter(f => formData[f]?.trim()).length}/{REQUIRED_FIELDS.length}</span>
                          </div>
                          <Progress value={(REQUIRED_FIELDS.filter(f => formData[f]?.trim()).length / REQUIRED_FIELDS.length) * 100} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-slate-400">
                            <span>Docs</span>
                            <span>{REQUIRED_DOCUMENTS.filter(d => documents[d]).length}/{REQUIRED_DOCUMENTS.length}</span>
                          </div>
                          <Progress value={(REQUIRED_DOCUMENTS.filter(d => documents[d]).length / REQUIRED_DOCUMENTS.length) * 100} className="h-1" />
                        </div>
                      </div>

                      {missingDocuments.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Documents manquants:</p>
                          <div className="space-y-1">
                            {missingDocuments.map((doc) => (
                              <div
                                key={doc}
                                className="flex items-center justify-between py-1 cursor-pointer hover:text-white text-slate-400"
                                onClick={() => setActiveTab("documents")}
                              >
                                <span className="text-xs">{DOC_LABELS[doc]}</span>
                                <AlertCircle className="h-3 w-3" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        {REQUIRED_DOCUMENTS.map((doc) => (
                          <div
                            key={doc}
                            className="flex items-center justify-between py-1 text-xs"
                          >
                            <span className={documents[doc] ? "text-green-400" : "text-slate-500"}>{DOC_LABELS[doc]}</span>
                            {documents[doc] && <Check className="h-3 w-3 text-green-400" />}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" size="sm" onClick={handleSaveProgress} disabled={saving || !driverId || isSubmitted}
                          className="flex-1 border-slate-700/50 text-slate-300 hover:bg-slate-800/30">
                          {saving ? <ButtonLoading /> : <><Save className="h-3.5 w-3.5 mr-1" /> Sauver</>}
                        </Button>
                        {isProfileComplete && driverId && !isSubmitted && (
                          <Button size="sm" onClick={handleSubmitForReview} disabled={submitting}
                            className="flex-1 bg-green-600 hover:bg-green-700">
                            {submitting ? <ButtonLoading /> : <><Send className="h-3.5 w-3.5 mr-1" /> Soumettre</>}
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
    </div>
  );
}
