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
import {
  User as UserIcon,
  Building2,
  FileText,
  BarChart3,
  Save,
  Send,
  Check,
  AlertCircle,
  Phone,
  Calendar,
  Shield,
  CreditCard,
  Home,
  IdCard,
  Car,
} from "lucide-react";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";
import { PageLoading, ButtonLoading } from "@/components/ui/loading";
import DriverDocumentUploader from "./DriverDocumentUploader";

interface DriverProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  license_number: string;
  driving_license_expiry_date: string;
  vtc_card_number: string;
  vtc_card_expiry_date: string;
  insurance_number: string;
  company_siret: string;
  address: string;
  city: string;
  postal_code: string;
}

interface DocumentStatus {
  driving_license: boolean;
  vtc_card: boolean;
  insurance: boolean;
  id_card: boolean;
  proof_of_address: boolean;
}

const REQUIRED_FIELDS: (keyof DriverProfileData)[] = [
  'first_name', 'last_name', 'phone',
  'vtc_card_number', 'vtc_card_expiry_date',
  'license_number', 'driving_license_expiry_date',
  'address', 'city', 'postal_code'
];

const REQUIRED_DOCUMENTS: (keyof DocumentStatus)[] = [
  'driving_license', 'vtc_card', 'insurance', 'id_card', 'proof_of_address'
];

const DOC_LABELS: Record<keyof DocumentStatus, string> = {
  driving_license: "Permis de conduire",
  vtc_card: "Carte VTC",
  insurance: "Assurance",
  id_card: "Pièce identité",
  proof_of_address: "Justificatif domicile",
};

const DOC_ICONS: Record<keyof DocumentStatus, React.ReactNode> = {
  driving_license: <Car className="h-4 w-4" />,
  vtc_card: <CreditCard className="h-4 w-4" />,
  insurance: <Shield className="h-4 w-4" />,
  id_card: <IdCard className="h-4 w-4" />,
  proof_of_address: <Home className="h-4 w-4" />,
};

export default function DriverProfileSetup({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("informations");
  const [submissionStatus, setSubmissionStatus] = useState<string>('draft');
  const [documents, setDocuments] = useState<DocumentStatus>({
    driving_license: false,
    vtc_card: false,
    insurance: false,
    id_card: false,
    proof_of_address: false,
  });
  const [formData, setFormData] = useState<DriverProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    license_number: "",
    driving_license_expiry_date: "",
    vtc_card_number: "",
    vtc_card_expiry_date: "",
    insurance_number: "",
    company_siret: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verified = searchParams?.get("verified");
    if (verified === "true") {
      toast({
        title: "Email confirmé !",
        description: "Votre adresse email a été vérifiée. Vous pouvez maintenant compléter votre profil.",
      });
      router.replace("/driver-portal/profile/setup", { scroll: false });
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { data: existingDriver, error } = await supabase
          .from("drivers")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking profile:", error);
        }

        if (existingDriver) {
          setDriverId(existingDriver.id);

          if (existingDriver.status === "active" && searchParams?.get("from") !== "driver-setup") {
            router.push("/driver-portal/dashboard");
            return;
          }

          setFormData({
            first_name: existingDriver.first_name || "",
            last_name: existingDriver.last_name || "",
            phone: existingDriver.phone || "",
            date_of_birth: existingDriver.date_of_birth || "",
            emergency_contact_name: existingDriver.emergency_contact_name || "",
            emergency_contact_phone: existingDriver.emergency_contact_phone || "",
            license_number: existingDriver.driving_license_number || "",
            driving_license_expiry_date: existingDriver.driving_license_expiry_date || "",
            vtc_card_number: existingDriver.vtc_card_number || "",
            vtc_card_expiry_date: existingDriver.vtc_card_expiry_date || "",
            insurance_number: existingDriver.insurance_number || "",
            company_siret: existingDriver.company_siret || "",
            address: existingDriver.address_line1 || "",
            city: existingDriver.city || "",
            postal_code: existingDriver.postal_code || "",
          });

          if ((existingDriver as any).submission_status) {
            setSubmissionStatus((existingDriver as any).submission_status);
          }
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [router, user.id, searchParams]);

  useEffect(() => {
    const checkDocuments = async () => {
      if (!driverId) return;
      
      try {
        const { data: docs, error } = await supabase
          .from("driver_documents")
          .select("document_type, validation_status")
          .eq("driver_id", driverId)
          .eq("validation_status", "approved");
        
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
      } catch (err) {
        console.error("Error checking documents:", err);
      }
    };
    
    checkDocuments();
  }, [driverId]);

  const calculateCompletion = useCallback((): number => {
    const filledFields = REQUIRED_FIELDS.filter(field => 
      formData[field]?.trim() !== ""
    ).length;
    
    const filledDocs = REQUIRED_DOCUMENTS.filter(doc => documents[doc]).length;
    
    const fieldWeight = 0.5;
    const docWeight = 0.5;
    
    const fieldProgress = (filledFields / REQUIRED_FIELDS.length) * fieldWeight * 100;
    const docProgress = (filledDocs / REQUIRED_DOCUMENTS.length) * docWeight * 100;
    
    return Math.min(100, fieldProgress + docProgress);
  }, [formData, documents]);

  const completionPercentage = calculateCompletion();
  const isProfileComplete = completionPercentage >= 95;
  const isSubmitted = submissionStatus === "pending_review";
  const isReadOnly = isSubmitted;

  const handleInputChange = (field: keyof DriverProfileData, value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProgress = async () => {
    if (!driverId) {
      toast({ title: "Erreur", description: "Aucun profil trouvé", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("drivers")
        .update({ 
          submission_status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq("id", driverId);
      
      if (error) throw error;
      
      toast({ 
        title: "Progression sauvegardée", 
        description: "Vous pouvez reprendre plus tard."
      });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!driverId || !isProfileComplete) {
      toast({ 
        title: "Profil incomplet", 
        description: "Complétez tous les champs et documents requis.",
        variant: "destructive" 
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("drivers")
        .update({ 
          submission_status: 'pending_review',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", driverId);
      
      if (error) throw error;
      
      setSubmissionStatus('pending_review');
      toast({ 
        title: "Profil soumis pour validation", 
        description: "Nos équipes vont examiner votre dossier."
      });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  const missingDocuments = REQUIRED_DOCUMENTS.filter(doc => !documents[doc]);

  if (loading) {
    return <PageLoading text="Vérification de votre profil..." />;
  }

  return (
    <motion.div
      className="min-h-screen bg-elegant-gradient"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isSubmitted ? "Votre profil" : "Configuration de votre profil"}
          </h1>
          <p className="text-slate-300">
            {isSubmitted 
              ? "Consultez l'état de votre profil et documents soumis."
              : "Complétez votre profil pour commencer à recevoir des courses"}
          </p>
        </div>

        {/* Status Banner */}
        {isSubmitted && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Send className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-100">Profil en cours de validation</h3>
                <p className="text-sm text-blue-200/80">
                  Votre dossier est en attente de validation par nos équipes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-transparent border-b border-white/10 h-auto p-0 gap-1">
            <TabsTrigger 
              value="informations"
              className="flex items-center gap-2 px-4 py-3 text-slate-300 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none bg-transparent"
              disabled={isReadOnly}
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Informations</span>
            </TabsTrigger>
            <TabsTrigger 
              value="societe"
              className="flex items-center gap-2 px-4 py-3 text-slate-300 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none bg-transparent"
              disabled={isReadOnly}
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Société</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="flex items-center gap-2 px-4 py-3 text-slate-300 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none bg-transparent"
              disabled={isReadOnly}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
              {!isSubmitted && missingDocuments.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 text-xs">
                  {missingDocuments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="progression"
              className="flex items-center gap-2 px-4 py-3 text-slate-300 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Progression</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informations */}
          <AnimatePresence mode="wait">
            <TabsContent value="informations" key="informations">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      placeholder="Votre prénom"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      placeholder="Votre nom"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date de naissance</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Contact d'urgence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Nom du contact</Label>
                      <Input
                        id="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                        placeholder="Nom"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_phone">Téléphone</Label>
                      <Input
                        id="emergency_contact_phone"
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                        placeholder="+33 6..."
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Adresse</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Adresse *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="123 Rue de la Paix"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Ville *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          placeholder="Paris"
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code">Code postal *</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => handleInputChange("postal_code", e.target.value)}
                          placeholder="75001"
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Tab: Société */}
            <TabsContent value="societe" key="societe">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vtc_card_number">Numéro de carte VTC *</Label>
                    <Input
                      id="vtc_card_number"
                      value={formData.vtc_card_number}
                      onChange={(e) => handleInputChange("vtc_card_number", e.target.value)}
                      placeholder="Numéro VTC"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vtc_card_expiry_date">Expiration carte VTC *</Label>
                    <Input
                      id="vtc_card_expiry_date"
                      type="date"
                      value={formData.vtc_card_expiry_date}
                      onChange={(e) => handleInputChange("vtc_card_expiry_date", e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_number">Numéro de permis *</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => handleInputChange("license_number", e.target.value)}
                      placeholder="Numéro de permis"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="driving_license_expiry_date">Expiration permis *</Label>
                    <Input
                      id="driving_license_expiry_date"
                      type="date"
                      value={formData.driving_license_expiry_date}
                      onChange={(e) => handleInputChange("driving_license_expiry_date", e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance_number">Numéro d'assurance</Label>
                    <Input
                      id="insurance_number"
                      value={formData.insurance_number}
                      onChange={(e) => handleInputChange("insurance_number", e.target.value)}
                      placeholder="Numéro d'assurance"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_siret">SIRET (optionnel)</Label>
                    <Input
                      id="company_siret"
                      value={formData.company_siret}
                      onChange={(e) => handleInputChange("company_siret", e.target.value)}
                      placeholder="123 456 789 00012"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Tab: Documents */}
            <TabsContent value="documents" key="documents">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-200">
                      <p className="font-medium text-blue-100 mb-1">Documents requis</p>
                      <p>Formats acceptés: JPG, PNG, WebP, PDF. Taille max: 10MB.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REQUIRED_DOCUMENTS.map((docType) => (
                    <DriverDocumentUploader
                      key={docType}
                      driverId={driverId ?? ""}
                      documentType={docType}
                      label={DOC_LABELS[docType]}
                      accept="image/*,application/pdf"
                      onUploaded={(r) => console.log("uploaded", docType, r)}
                    />
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            {/* Tab: Progression */}
            <TabsContent value="progression" key="progression">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Progress Overview */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Progression du profil</h3>
                    <Badge className={isProfileComplete ? "bg-green-500" : "bg-blue-500"}>
                      {isProfileComplete ? (
                        <><Check className="h-3 w-3 mr-1" /> Complet</>
                      ) : (
                        `${Math.round(completionPercentage)}%`
                      )}
                    </Badge>
                  </div>
                  
                  <Progress value={completionPercentage} className="h-3 mb-4" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">Informations</span>
                        <span className="text-white">
                          {REQUIRED_FIELDS.filter(f => formData[f]?.trim()).length}/{REQUIRED_FIELDS.length}
                        </span>
                      </div>
                      <Progress 
                        value={(REQUIRED_FIELDS.filter(f => formData[f]?.trim()).length / REQUIRED_FIELDS.length) * 100} 
                        className="h-1.5" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">Documents</span>
                        <span className="text-white">
                          {REQUIRED_DOCUMENTS.filter(d => documents[d]).length}/{REQUIRED_DOCUMENTS.length}
                        </span>
                      </div>
                      <Progress 
                        value={(REQUIRED_DOCUMENTS.filter(d => documents[d]).length / REQUIRED_DOCUMENTS.length) * 100} 
                        className="h-1.5" 
                      />
                    </div>
                  </div>
                </div>

                {/* Missing Documents */}
                {missingDocuments.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 border border-yellow-500/30">
                    <h3 className="text-lg font-semibold text-yellow-100 mb-4">
                      Documents manquants ({missingDocuments.length})
                    </h3>
                    <div className="space-y-2">
                      {missingDocuments.map((doc) => (
                        <div 
                          key={doc}
                          className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-lg cursor-pointer hover:bg-yellow-500/10 transition-colors"
                          onClick={() => navigateToTab("documents")}
                        >
                          <div className="flex items-center gap-3">
                            {DOC_ICONS[doc]}
                            <span className="text-yellow-200">{DOC_LABELS[doc]}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300">
                            Ajouter <AlertCircle className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Documents Status */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Statut des documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {REQUIRED_DOCUMENTS.map((doc) => (
                      <div 
                        key={doc}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          documents[doc] 
                            ? "bg-green-500/10 border border-green-500/30" 
                            : "bg-slate-700/30 border border-slate-600/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={documents[doc] ? "text-green-400" : "text-slate-400"}>
                            {DOC_ICONS[doc]}
                          </div>
                          <span className={documents[doc] ? "text-green-200" : "text-slate-400"}>
                            {DOC_LABELS[doc]}
                          </span>
                        </div>
                        {documents[doc] ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleSaveProgress}
                    disabled={saving || !driverId || isSubmitted}
                    className="flex items-center gap-2"
                  >
                    {saving ? <ButtonLoading /> : <><Save className="h-4 w-4" /> Sauvegarder</>}
                  </Button>
                  
                  {isProfileComplete && driverId && !isSubmitted && (
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={submitting}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? <ButtonLoading /> : <><Send className="h-4 w-4" /> Soumettre pour validation</>}
                    </Button>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </motion.div>
  );
}
