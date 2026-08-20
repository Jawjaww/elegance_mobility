"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];
type DriverDocRow = Database["public"]["Tables"]["driver_documents"]["Row"];
type DriverStatus = Database["public"]["Enums"]["driver_status"];

const statusColors: Record<DriverStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending_validation: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
  on_vacation: "bg-blue-100 text-blue-800",
  incomplete: "bg-gray-100 text-gray-800",
  draft: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
  pending_review: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<DriverStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  pending_validation: "En attente de validation",
  suspended: "Suspendu",
  on_vacation: "En congé",
  incomplete: "Dossier incomplet",
  draft: "Brouillon",
  rejected: "Rejeté",
  pending_review: "En révision",
};

const docStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  pending_temp: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const docStatusLabels: Record<string, string> = {
  pending: "En attente",
  pending_temp: "En attente (temp.)",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const REQUIRED_DOCUMENTS = [
  "driving_license",
  "vtc_card",
  "insurance",
  "id_card",
  "proof_of_address",
] as const;

const DOC_LABELS: Record<string, string> = {
  driving_license: "Permis de conduire",
  vtc_card: "Carte VTC",
  insurance: "Assurance",
  id_card: "Pièce d'identité",
  proof_of_address: "Justificatif de domicile",
};

const SECTIONS = [
  {
    id: "profil",
    label: "Profil",
    icon: "👤",
    description: "Informations personnelles",
  },
  {
    id: "professionnel",
    label: "Professionnel",
    icon: "💼",
    description: "Cartes et autorisations",
  },
  {
    id: "documents",
    label: "Documents",
    icon: "📄",
    description: "Justificatifs à fournir",
  },
  {
    id: "validation",
    label: "Validation",
    icon: "🛡️",
    description: "Vérification et envoi",
  },
];

export default function DriverFolderAdmin({ driverId }: Readonly<{ driverId: string }>) {
  const { toast } = useToast();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [docs, setDocs] = useState<DriverDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<DriverRow>>({});
  const [saving, setSaving] = useState(false);
  const [completeness, setCompleteness] = useState<{
    is_complete: boolean;
    completion_percentage: number;
    missing_fields: string[];
  } | null>(null);
  const [debugDetails, setDebugDetails] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!driverId) return;
    loadData();
  }, [driverId]);

  // Si le driver est null après chargement (session invalide), rediriger vers login
  useEffect(() => {
    if (dataLoaded && !driver) {
      console.warn(
        "[DriverFolderAdmin] No driver data after load — redirecting to login",
      );
      globalThis.dispatchEvent(
        new CustomEvent("elegance:authError", {
          detail: {
            title: "Session expirée",
            description: "Votre session a expirée — veuillez vous reconnecter.",
          },
        }),
      );
      setTimeout(() => {
        globalThis.location.href = "/backoffice-portal/login";
      }, 1000);
    }
  }, [dataLoaded, driver]);

  async function generateSignedUrls(docsData: DriverDocRow[]) {
    const urls: Record<string, string> = {};
    for (const doc of docsData) {
      if (doc.file_url && !doc.file_url.startsWith("http")) {
        try {
          const { data: urlData } = await supabase.storage
            .from("driver-documents")
            .createSignedUrl(doc.file_url, 3600);
          if (urlData?.signedUrl) {
            urls[doc.id] = urlData.signedUrl;
          }
        } catch (e) {
          console.warn("Failed to create signed URL for", doc.file_url, e);
        }
      } else if (doc.file_url?.startsWith("http")) {
        urls[doc.id] = doc.file_url;
      }
    }
    setSignedUrls(urls);
  }

  async function fetchCompleteness(userId: string) {
    try {
      const { data: compData, error: compErr } = await supabase
        .rpc("check_driver_profile_completeness", {
          driver_user_id: userId,
        })
        .single();
      if (!compErr && compData) {
        const d = compData as any;
        setCompleteness({
          is_complete: d.is_complete,
          completion_percentage: d.completion_percentage,
          missing_fields: d.missing_fields ?? [],
        });
      }

      const { data: debugData } = await supabase.rpc(
        "debug_driver_completeness",
        { driver_user_id: userId },
      );
      if (debugData) {
        setDebugDetails(debugData);
      }
    } catch (e) {
      console.warn("DriverFolderAdmin.completeness check error:", e);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      console.log("[DriverFolderAdmin] Loading data for driverId:", driverId);

      const [
        { data: driverData, error: driverErr },
        { data: docsData, error: docsErr },
      ] = await Promise.all([
        supabase.from("drivers").select("*").eq("id", driverId).maybeSingle(),
        supabase
          .from("driver_documents")
          .select("*")
          .eq("driver_id", driverId)
          .order("upload_date", { ascending: false }),
      ]);

      console.log(
        "[DriverFolderAdmin] Driver data:",
        driverData,
        "error:",
        driverErr,
      );
      console.log(
        "[DriverFolderAdmin] Docs data:",
        docsData,
        "count:",
        docsData?.length,
        "error:",
        docsErr,
      );

      if (driverErr) throw driverErr;
      if (docsErr) throw docsErr;
      setDriver(driverData);
      setForm(driverData ?? {});
      setDocs(docsData ?? []);

      if (docsData && docsData.length > 0) {
        await generateSignedUrls(docsData);
      }

      if (driverData?.user_id) {
        await fetchCompleteness(driverData.user_id);
      }
    } catch (e: any) {
      console.warn("DriverFolderAdmin.loadData error:", e);
      const msg =
        e?.message ?? (typeof e === "object" ? JSON.stringify(e) : String(e));
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  }

  async function saveDriver() {
    setSaving(true);
    try {
      const update: Partial<DriverRow> = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        date_of_birth: form.date_of_birth || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        status: form.status as DriverStatus,
        address_line1: form.address_line1,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        postal_code: form.postal_code || null,
        driving_license_number: form.driving_license_number || null,
        driving_license_expiry_date: form.driving_license_expiry_date || null,
        vtc_card_number: form.vtc_card_number || null,
        vtc_card_expiry_date: form.vtc_card_expiry_date || null,
        insurance_number: form.insurance_number || null,
        company_name: form.company_name || null,
        company_phone: form.company_phone || null,
        company_siret: form.company_siret || null,
      };
      const { error } = await supabase
        .from("drivers")
        .update(update)
        .eq("id", driverId);
      if (error) throw error;
      toast({ title: "Profil mis à jour" });
      setEditing(false);
      loadData();
    } catch (e: any) {
      console.warn("DriverFolderAdmin.saveDriver error:", e);
      const msg =
        e?.message ?? (typeof e === "object" ? JSON.stringify(e) : String(e));
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function validateDoc(docId: string, approve: boolean) {
    try {
      let reason: string | null = null;
      if (!approve) {
        reason = globalThis.prompt("Motif du rejet (optionnel) :") || null;
        if (reason === "") reason = null;
      }
      const { error } = await supabase.rpc("validate_driver_document", {
        p_document_id: docId,
        p_approve: approve,
        p_reason: reason,
      });
      if (error) throw error;
      toast({ title: approve ? "Document approuvé" : "Document rejeté" });
      loadData();
    } catch (e: any) {
      console.warn("DriverFolderAdmin.validateDoc error:", e);
      const msg =
        e?.message ?? (typeof e === "object" ? JSON.stringify(e) : String(e));
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  }

  async function approveOrRejectDossier(approved: boolean) {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Admin non authentifié");

      let rejectionReason: string | null = null;
      if (!approved) {
        rejectionReason =
          window.prompt("Motif de rejet (optionnel) :")?.trim() || null;
      }

      const { data, error } = await supabase.rpc("validate_driver_dossier", {
        p_driver_id: driverId,
        p_admin_user_id: user.id,
        p_approved: approved,
        p_rejection_reason: rejectionReason,
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (row?.success === false) {
        throw new Error(row.message || "Validation refusée");
      }

      toast({
        title: approved ? "Dossier validé" : "Dossier rejeté",
        description: row?.message,
      });
      loadData();
    } catch (e: any) {
      console.warn("DriverFolderAdmin.approveOrRejectDossier error:", e);
      const msg =
        e?.message ?? (typeof e === "object" ? JSON.stringify(e) : String(e));
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  }

  if (loading) return <div>Chargement du dossier...</div>;

  const completion = calculateCompletion();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/60 shadow-xl overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {driver?.first_name ?? "—"} {driver?.last_name ?? ""}
              </h2>
              {driver?.status !== "draft" && (
                <Badge
                  className={`px-2.5 py-0.5 text-xs font-semibold ${
                    statusColors[driver?.status as DriverStatus] ||
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  {statusLabels[driver?.status as DriverStatus] || driver?.status}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-800/80 text-gray-400 text-xs rounded-md border border-gray-700/50 font-mono shadow-sm">
                ID: {driver?.id}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  onClick={saveDriver}
                  disabled={saving}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 shadow-md transition-all"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setForm(driver ?? {});
                  }}
                  className="border-gray-600 hover:bg-gray-700 transition-all"
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} size="sm" className="shadow-md transition-all">
                Modifier le profil
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mt-6 pt-4 border-t border-gray-700/50">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-sm font-medium text-gray-300">Complétion du dossier</span>
              {completion < 100 && (
                <p className="text-xs text-yellow-400/80 mt-0.5">Le dossier nécessite votre attention</p>
              )}
            </div>
            <span className="text-lg font-bold text-white">{Math.round(completion)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2.5 shadow-inner border border-gray-700/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                completion >= 100 
                  ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                  : "bg-gradient-to-r from-yellow-500 to-amber-400"
              }`}
              style={{ width: `${Math.min(100, completion)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {SECTIONS.map((s, i) => (
          <button
            type="button"
            key={s.id}
            onClick={() => setActiveSection(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeSection === i
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        {activeSection === 0 && renderProfil()}
        {activeSection === 1 && renderProfessionnel()}
        {activeSection === 2 && renderDocuments()}
        {activeSection === 3 && renderValidation()}
      </div>
    </div>
  );

  /* ---- Section renderers ---- */

  function renderProfil() {
    const fields: { key: keyof DriverRow; label: string; type?: string }[] = [
      { key: "first_name", label: "Prénom" },
      { key: "last_name", label: "Nom" },
      { key: "phone", label: "Téléphone" },
      { key: "date_of_birth", label: "Date de naissance", type: "date" },
      { key: "address_line1", label: "Adresse" },
      { key: "address_line2", label: "Complément d'adresse" },
      { key: "city", label: "Ville" },
      { key: "postal_code", label: "Code postal" },
      { key: "emergency_contact_name", label: "Contact d'urgence — Nom" },
      {
        key: "emergency_contact_phone",
        label: "Contact d'urgence — Téléphone",
      },
    ];

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Informations personnelles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-sm text-gray-400 mb-1 block">
                {f.label}
              </label>
              {editing ? (
                <Input
                  type={f.type}
                  value={(form[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <div className="text-white">
                  {(driver?.[f.key] as string) || "-"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderProfessionnel() {
    const fields: { key: keyof DriverRow; label: string; type?: string }[] = [
      { key: "driving_license_number", label: "N° Permis de conduire" },
      {
        key: "driving_license_expiry_date",
        label: "Expiration permis",
        type: "date",
      },
      { key: "vtc_card_number", label: "N° Carte VTC" },
      {
        key: "vtc_card_expiry_date",
        label: "Expiration carte VTC",
        type: "date",
      },
      { key: "insurance_number", label: "N° Assurance" },
      { key: "company_siret", label: "SIRET" },
      { key: "company_name", label: "Raison sociale" },
      { key: "company_phone", label: "Téléphone entreprise" },
    ];

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Informations professionnelles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-sm text-gray-400 mb-1 block">
                {f.label}
              </label>
              {editing ? (
                <Input
                  type={f.type}
                  value={(form[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <div className="text-white">
                  {(driver?.[f.key] as string) || "-"}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status (read-only chips — dossier transitions via RPC only) */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <span className="text-sm text-gray-400 mb-2 block">
            Statut actuel
          </span>
          <Badge className={statusColors[driver?.status ?? "draft"]}>
            {statusLabels[driver?.status ?? "draft"]}
          </Badge>
          <p className="text-xs text-gray-500 mt-2">
            Approuver / rejeter uniquement via les actions dossier (RPC
            validate_driver_dossier) quand le statut est pending_review.
          </p>
        </div>
      </div>
    );
  }

  function renderDocuments() {
    const docsByType = new Map<string, DriverDocRow[]>();
    for (const d of docs) {
      const arr = docsByType.get(d.document_type) ?? [];
      arr.push(d);
      docsByType.set(d.document_type, arr);
    }

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
        <div className="space-y-4">
          {REQUIRED_DOCUMENTS.map((docType) => {
            const typeDocs = docsByType.get(docType) ?? [];
            const latest = typeDocs[0];
            return (
              <div key={docType} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">
                    {DOC_LABELS[docType] ?? docType}
                  </span>
                  {latest && (
                    <Badge
                      className={
                        docStatusColors[latest.validation_status ?? ""] ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {docStatusLabels[latest.validation_status ?? ""] ??
                        latest.validation_status}
                    </Badge>
                  )}
                </div>
                {typeDocs.length === 0 ? (
                  <div className="text-sm text-gray-400">Aucun document</div>
                ) : (
                  <div className="space-y-2">
                    {typeDocs.map((d) => {
                      const signedUrl = signedUrls[d.id];
                      return (
                        <div
                          key={d.id}
                          className="flex items-start gap-3 bg-gray-800 p-3 rounded"
                        >
                          <DocumentPreview doc={d} signedUrl={signedUrl} />

                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm">
                              {d.file_name ?? "-"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {d.upload_date
                                ? new Date(d.upload_date).toLocaleString()
                                : "-"}
                              {d.expiry_date &&
                                ` — Expire: ${new Date(d.expiry_date).toLocaleDateString()}`}
                            </div>
                            {d.rejection_reason && (
                              <div className="text-xs text-red-400">
                                Motif rejet: {d.rejection_reason}
                              </div>
                            )}
                          </div>

                          <DocumentActions doc={d} onValidate={validateDoc} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderValidation() {
    const isComplete = completeness?.is_complete ?? false;
    const completionPct = completeness?.completion_percentage ?? 0;
    const missingFields = completeness?.missing_fields ?? [];

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Validation du dossier
        </h3>

        {/* Résultat de la vérification automatique Supabase */}
        <div
          className={`p-4 rounded-lg mb-6 border ${
            isComplete
              ? "bg-green-900/20 border-green-700"
              : "bg-yellow-900/20 border-yellow-700"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{isComplete ? "✅" : "⚠️"}</span>
            <div>
              <div className="font-semibold text-white">
                {isComplete ? "Dossier complet" : "Dossier incomplet"}
              </div>
              <div className="text-sm text-gray-400">
                Vérification automatique Supabase — {completionPct}% complété
              </div>
            </div>
          </div>

          {missingFields.length > 0 && (
            <div>
              <div className="text-sm font-medium text-yellow-300 mb-2">
                Champs manquants :
              </div>
              <ul className="space-y-1">
                {missingFields.map((f) => (
                  <li
                    key={f}
                    className="text-sm text-red-400 flex items-center gap-2"
                  >
                    <span>•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Détails debug */}
        {debugDetails.length > 0 && (
          <details className="mb-6">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">
              Détails de la vérification ({debugDetails.length} contrôles)
            </summary>
            <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
              {debugDetails.map((d: any) => (
                <div key={d.check_name ?? d.field_category} className="flex items-center gap-2 text-sm">
                  <span
                    className={d.is_valid ? "text-green-400" : "text-red-400"}
                  >
                    {d.is_valid ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-300 flex-1">{d.check_name}</span>
                  <span className="text-xs text-gray-500">
                    {d.field_category}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Actions sur le dossier */}
        <div className="pt-4 border-t border-gray-700">
          <span className="text-sm text-gray-400 mb-2 block">
            Actions sur le dossier
          </span>
          <div className="flex flex-wrap gap-2">
            {driver?.status === "pending_review" && (
              <>
                <Button
                  size="sm"
                  onClick={() => approveOrRejectDossier(true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!isComplete}
                >
                  ✓ Valider le dossier
                </Button>
                <Button
                  size="sm"
                  onClick={() => approveOrRejectDossier(false)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  ✗ Rejeter le dossier
                </Button>
              </>
            )}
            {driver?.status !== "pending_review" && (
              <p className="text-xs text-gray-500">
                Validation RPC disponible uniquement en statut pending_review.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function calculateCompletion(): number {
    const profilFields: (keyof DriverRow)[] = [
      "first_name",
      "last_name",
      "phone",
      "address_line1",
      "city",
      "postal_code",
    ];
    const proFields: (keyof DriverRow)[] = [
      "driving_license_number",
      "driving_license_expiry_date",
      "vtc_card_number",
      "vtc_card_expiry_date",
    ];

    const profilScore =
      (profilFields.filter((f) => driver?.[f]).length / profilFields.length) *
      30;
    const proScore =
      (proFields.filter((f) => driver?.[f]).length / proFields.length) * 30;
    const docsScore =
      (REQUIRED_DOCUMENTS.filter((dt) =>
        docs.some((d) => d.document_type === dt),
      ).length /
        REQUIRED_DOCUMENTS.length) *
      40;

    return Math.min(100, profilScore + proScore + docsScore);
  }
}

// Extracted components to reduce cognitive complexity and nesting

function DocumentPreview({
  doc,
  signedUrl,
}: Readonly<{
  doc: DriverDocRow;
  signedUrl?: string;
}>) {
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.exec(doc.file_url ?? "");

  if (signedUrl && isImage) {
    return (
      <img
        src={signedUrl}
        alt={doc.file_name ?? doc.document_type}
        className="w-16 h-16 object-cover rounded border border-gray-600 flex-shrink-0"
      />
    );
  }

  if (signedUrl) {
    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noreferrer"
        className="w-16 h-16 flex items-center justify-center rounded border border-gray-600 bg-gray-700 text-gray-400 text-xs flex-shrink-0 hover:bg-gray-600"
      >
        📄 Voir
      </a>
    );
  }

  return (
    <div className="w-16 h-16 flex items-center justify-center rounded border border-gray-600 bg-gray-700 text-gray-500 text-xs flex-shrink-0">
      —
    </div>
  );
}

function DocumentActions({
  doc,
  onValidate,
}: Readonly<{
  doc: DriverDocRow;
  onValidate: (docId: string, approve: boolean) => void;
}>) {
  if (doc.validation_status !== "pending") return null;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Button
        size="sm"
        onClick={() => onValidate(doc.id, true)}
        className="text-xs bg-green-600 hover:bg-green-700"
      >
        Approuver
      </Button>
      <Button
        size="sm"
        onClick={() => onValidate(doc.id, false)}
        variant="destructive"
        className="text-xs"
      >
        Rejeter
      </Button>
    </div>
  );
}
