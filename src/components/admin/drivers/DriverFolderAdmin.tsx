"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import { estimateDriverCompleteness } from "@/lib/drivers/estimateDriverCompleteness";
import {
  DRIVER_DOCS_BUCKET,
  toStoragePath,
} from "@/lib/storage/driverDocumentPath";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import {
  driverStatusColors,
  driverStatusLabels,
  docStatusColors,
  docStatusLabels,
} from "@/components/admin/drivers/driverStatusStyles";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Check,
  X,
  Upload,
  Loader2,
  ArrowLeft,
  User,
  Briefcase,
  FileText,
  ShieldCheck,
  Pencil,
} from "lucide-react";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];
type DriverDocRow = Database["public"]["Tables"]["driver_documents"]["Row"];
type DriverStatus = Database["public"]["Enums"]["driver_status"];

type CompletenessView = {
  is_complete: boolean;
  completion_percentage: number;
  missing_fields: string[];
  can_submit: boolean;
  missing_for_submit: string[];
  source: "rpc" | "local";
};

function isImageFileRef(fileRef: string | null | undefined): boolean {
  if (!fileRef) return false;
  const pathOnly = fileRef.split("?")[0] ?? fileRef;
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(pathOnly);
}

async function tryAdminDocumentProxy(
  path: string,
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/admin/driver-documents?path=${encodeURIComponent(path)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.ok) {
      const blob = await res.blob();
      return blob.size > 0 ? URL.createObjectURL(blob) : null;
    }
    const body = await res.text();
    console.warn(
      "[DriverFolderAdmin] admin document proxy failed for",
      path,
      res.status,
      body.slice(0, 200),
    );
  } catch (e) {
    console.warn(
      "[DriverFolderAdmin] admin document proxy error for",
      path,
      e,
    );
  }
  return null;
}

async function tryStorageSignedUrl(path: string): Promise<string | null> {
  try {
    const { data: urlData, error } = await supabase.storage
      .from(DRIVER_DOCS_BUCKET)
      .createSignedUrl(path, 3600);
    if (urlData?.signedUrl) return urlData.signedUrl;
    if (error) {
      console.warn(
        "[DriverFolderAdmin] createSignedUrl failed for",
        path,
        error.message,
      );
    }
  } catch (e) {
    console.warn("Failed to create signed URL for", path, e);
  }
  return null;
}

async function tryUploadSignedApi(
  path: string,
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/upload?op=signed&path=${encodeURIComponent(path)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const body = (await res.json()) as {
      ok?: boolean;
      signedUrl?: string;
      error?: string;
    };
    if (res.ok && body.signedUrl) return body.signedUrl;
    console.warn(
      "[DriverFolderAdmin] signed URL API fallback failed for",
      path,
      body.error || res.status,
    );
  } catch (e) {
    console.warn(
      "[DriverFolderAdmin] signed URL API fallback error for",
      path,
      e,
    );
  }
  return null;
}

async function resolveSignedUrlForPath(
  path: string,
  accessToken: string | undefined,
): Promise<string | null> {
  // Prefer same-origin admin proxy (service role on local URL) — reliable for private bucket.
  if (accessToken) {
    const proxyUrl = await tryAdminDocumentProxy(path, accessToken);
    if (proxyUrl) return proxyUrl;
  }

  const storageUrl = await tryStorageSignedUrl(path);
  if (storageUrl) return storageUrl;

  if (!accessToken) return null;
  return tryUploadSignedApi(path, accessToken);
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  try {
    return JSON.stringify(e);
  } catch {
    return "Erreur inconnue";
  }
}

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
    icon: User,
    description: "Informations personnelles",
  },
  {
    id: "professionnel",
    label: "Professionnel",
    icon: Briefcase,
    description: "Cartes et autorisations",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    description: "Justificatifs à fournir",
  },
  {
    id: "validation",
    label: "Validation",
    icon: ShieldCheck,
    description: "Vérification et envoi",
  },
] as const;

export default function DriverFolderAdmin({ driverId }: Readonly<{ driverId: string }>) {
  const { toast } = useToast();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [docs, setDocs] = useState<DriverDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<DriverRow>>({});
  const [saving, setSaving] = useState(false);
  const [completeness, setCompleteness] = useState<CompletenessView | null>(
    null,
  );
  const [completenessError, setCompletenessError] = useState<string | null>(
    null,
  );
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId) return;
    loadData();
  }, [driverId]);


  async function generateSignedUrls(docsData: DriverDocRow[]) {
    // Revoke previous blob: URLs to avoid leaks
    setSignedUrls((prev) => {
      for (const url of Object.values(prev)) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      }
      return prev;
    });

    const urls: Record<string, string> = {};
    await supabase.auth.getUser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    for (const doc of docsData) {
      if (!doc.file_url) continue;
      const path = toStoragePath(doc.file_url);
      if (!path) {
        console.warn(
          "[DriverFolderAdmin] Could not resolve storage path for",
          doc.file_url,
        );
        continue;
      }
      const signed = await resolveSignedUrlForPath(path, accessToken);
      if (signed) urls[doc.id] = signed;
    }
    setSignedUrls(urls);

    const missing = docsData.filter((d) => d.file_url && !urls[d.id]).length;
    if (missing > 0) {
      toast({
        title: "Aperçu documents",
        description: `${missing} document(s) non prévisualisable(s). Vérifiez le storage local.`,
        variant: "destructive",
      });
    }
  }

  function applyLocalCompleteness(
    driverRow: DriverRow,
    docsData: DriverDocRow[],
    hasPlate: boolean | null,
    rpcError?: string,
  ) {
    const local = estimateDriverCompleteness(driverRow, docsData, hasPlate);
    setCompleteness({ ...local, source: "local" });
    setCompletenessError(rpcError ?? null);
  }

  async function fetchCompleteness(
    userId: string,
    driverRow: DriverRow,
    docsData: DriverDocRow[],
    hasPlate: boolean | null,
  ) {
    try {
      const { data: compData, error: compErr } = await supabase
        .rpc("check_driver_profile_completeness", {
          driver_user_id: userId,
        })
        .single();
      if (compErr) {
        console.warn(
          "[DriverFolderAdmin] completeness RPC failed:",
          compErr.code,
          compErr.message,
          compErr.details,
        );
        applyLocalCompleteness(
          driverRow,
          docsData,
          hasPlate,
          compErr.message || "RPC completeness failed",
        );
        return;
      }
      if (!compData) {
        applyLocalCompleteness(
          driverRow,
          docsData,
          hasPlate,
          "RPC completeness empty",
        );
        return;
      }
      const d = compData as {
        is_complete?: boolean;
        completion_percentage?: number;
        missing_fields?: string[];
        can_submit?: boolean;
        missing_for_submit?: string[];
      };
      const missing = d.missing_fields ?? [];
      if (missing.includes("not authorized")) {
        applyLocalCompleteness(
          driverRow,
          docsData,
          hasPlate,
          "RPC completeness not authorized",
        );
        return;
      }
      setCompletenessError(null);
      setCompleteness({
        is_complete: Boolean(d.is_complete),
        completion_percentage: Number(d.completion_percentage ?? 0),
        missing_fields: missing,
        can_submit: Boolean(d.can_submit),
        missing_for_submit: d.missing_for_submit ?? [],
        source: "rpc",
      });
    } catch (e) {
      console.warn("DriverFolderAdmin.completeness check error:", e);
      applyLocalCompleteness(driverRow, docsData, hasPlate, errorMessage(e));
    }
  }

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      console.log("[DriverFolderAdmin] Loading data for driverId:", driverId);

      const { data: driverData, error: driverErr } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", driverId)
        .maybeSingle();

      console.log(
        "[DriverFolderAdmin] Driver data:",
        driverData,
        "error:",
        driverErr,
      );

      if (driverErr) throw driverErr;
      setDriver(driverData);
      setForm(driverData ?? {});

      if (!driverData) {
        setDocs([]);
        return;
      }

      const { data: docsData, error: docsErr } = await supabase
        .from("driver_documents")
        .select("*")
        .eq("driver_id", driverId)
        .order("upload_date", { ascending: false });

      console.log(
        "[DriverFolderAdmin] Docs data:",
        docsData,
        "count:",
        docsData?.length,
        "error:",
        docsErr,
      );

      if (docsErr) {
        console.warn(
          "[DriverFolderAdmin] Documents fetch failed:",
          docsErr.message,
        );
        setDocs([]);
      } else {
        setDocs(docsData ?? []);
        if (docsData && docsData.length > 0) {
          await generateSignedUrls(docsData);
        }
      }

      const resolvedDocs = docsErr ? [] : (docsData ?? []);
      let hasPlate: boolean | null = null;
      const { data: vehicles, error: vehicleErr } = await supabase
        .from("vehicles")
        .select("license_plate")
        .eq("driver_id", driverId);
      if (!vehicleErr && vehicles) {
        hasPlate = vehicles.some((v) => {
          const plate = (v.license_plate ?? "").trim();
          return plate !== "" && plate !== "À compléter";
        });
      }

      if (driverData.user_id) {
        await fetchCompleteness(
          driverData.user_id,
          driverData,
          resolvedDocs,
          hasPlate,
        );
      } else {
        applyLocalCompleteness(driverData, resolvedDocs, hasPlate);
      }
    } catch (e: unknown) {
      console.warn("DriverFolderAdmin.loadData error:", e);
      setLoadError(errorMessage(e));
      toast({
        title: "Erreur",
        description: errorMessage(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    } catch (e: unknown) {
      console.warn("DriverFolderAdmin.saveDriver error:", e);
      toast({
        title: "Erreur",
        description: errorMessage(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function validateDoc(docId: string, approve: boolean) {
    try {
      const doc = docs.find((d) => d.id === docId);
      if (approve) {
        if (!doc?.expiry_date) {
          toast({
            title: "Date requise",
            description:
              "Corrigez ou saisissez la date de fin de validité avant d'approuver.",
            variant: "destructive",
          });
          return;
        }
        if (new Date(doc.expiry_date) < new Date(new Date().toDateString())) {
          toast({
            title: "Document expiré",
            description: "Impossible d'approuver un document déjà expiré.",
            variant: "destructive",
          });
          return;
        }
      }

      let reason: string | null = null;
      if (!approve) {
        reason = globalThis.prompt("Motif du rejet (optionnel) :") || null;
        if (reason === "") reason = null;
      }
      const { data, error } = await supabase.rpc("validate_driver_document", {
        p_document_id: docId,
        p_approve: approve,
        p_reason: reason,
      });
      if (error) throw error;
      const payload = data as { success?: boolean; error?: string } | null;
      if (payload?.success === false) {
        throw new Error(payload.error || "Validation refusée");
      }
      toast({ title: approve ? "Document approuvé" : "Document rejeté" });
      loadData();
    } catch (e: unknown) {
      console.warn("DriverFolderAdmin.validateDoc error:", e);
      toast({
        title: "Erreur",
        description: errorMessage(e),
        variant: "destructive",
      });
    }
  }

  async function saveDocExpiry(docId: string, expiryDate: string) {
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
        throw new Error("Format de date invalide (AAAA-MM-JJ)");
      }
      const { data, error } = await supabase.rpc("update_driver_document_expiry", {
        p_document_id: docId,
        p_expiry_date: expiryDate,
      });
      if (error) throw error;
      const payload = data as { success?: boolean; error?: string } | null;
      if (payload?.success === false) {
        throw new Error(payload.error || "Mise à jour refusée");
      }
      toast({ title: "Date de validité mise à jour" });
      await loadData();
    } catch (e: unknown) {
      toast({
        title: "Erreur",
        description: errorMessage(e),
        variant: "destructive",
      });
    }
  }

  async function uploadAdminDocument(docType: string, file: File) {
    setUploadingType(docType);
    try {
      await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Session admin requise");

      const form = new FormData();
      form.append("file", file);
      form.append("document_type", docType);
      form.append("driver_id", driverId);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || `Upload échoué (${res.status})`);
      }
      toast({ title: "Document déposé", description: DOC_LABELS[docType] });
      await loadData();
    } catch (e: unknown) {
      console.warn("DriverFolderAdmin.uploadAdminDocument error:", e);
      toast({
        title: "Erreur upload",
        description: errorMessage(e),
        variant: "destructive",
      });
    } finally {
      setUploadingType(null);
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
          globalThis.prompt("Motif de rejet (optionnel) :")?.trim() || null;
      }

      const { data, error } = await supabase.rpc("validate_driver_dossier", {
        p_driver_id: driverId,
        p_admin_user_id: user.id,
        p_approved: approved,
        p_rejection_reason: rejectionReason,
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (
        row &&
        typeof row === "object" &&
        "success" in row &&
        (row as { success?: boolean }).success === false
      ) {
        throw new Error(
          (row as { message?: string }).message || "Validation refusée",
        );
      }

      toast({
        title: approved ? "Dossier validé" : "Dossier rejeté",
        description:
          row && typeof row === "object" && "message" in row
            ? String((row as { message?: string }).message ?? "")
            : undefined,
      });
      loadData();
    } catch (e: unknown) {
      console.warn("DriverFolderAdmin.approveOrRejectDossier error:", e);
      toast({
        title: "Erreur",
        description: errorMessage(e),
        variant: "destructive",
      });
    }
  }

  async function cancelPendingReview() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Admin non authentifié");

      const reason =
        globalThis
          .prompt(
            "Motif du renvoi pour correction (optionnel) :",
          )
          ?.trim() || null;

      const confirmed = globalThis.confirm(
        "Renvoyer le dossier en brouillon pour que le chauffeur puisse corriger ?",
      );
      if (!confirmed) return;

      const { data, error } = await supabase.rpc(
        "cancel_driver_dossier_review",
        {
          p_driver_id: driverId,
          p_actor_user_id: user.id,
          p_reason: reason,
        },
      );
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (
        row &&
        typeof row === "object" &&
        "success" in row &&
        (row as { success?: boolean }).success === false
      ) {
        throw new Error(
          (row as { message?: string }).message || "Annulation refusée",
        );
      }

      toast({
        title: "Demande annulée",
        description:
          row && typeof row === "object" && "message" in row
            ? String((row as { message?: string }).message ?? "")
            : "Le chauffeur peut à nouveau modifier son dossier.",
      });
      loadData();
    } catch (e: unknown) {
      console.warn("DriverFolderAdmin.cancelPendingReview error:", e);
      toast({
        title: "Erreur",
        description: errorMessage(e),
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-400 hover:text-neutral-100 -ml-2"
          asChild
        >
          <Link href="/backoffice-portal/drivers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux chauffeurs
          </Link>
        </Button>
        <p className="text-sm text-neutral-300">
          {loadError ?? "Chauffeur introuvable."}
        </p>
      </div>
    );
  }

  const completion = completeness?.completion_percentage;
  const canSubmitReady = completeness?.can_submit ?? false;
  const isOpsComplete = completeness?.is_complete ?? false;
  const completionLabel = "Complétion du dossier";

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="text-neutral-400 hover:text-neutral-100 -ml-2"
        asChild
      >
        <Link href="/backoffice-portal/drivers">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux chauffeurs
        </Link>
      </Button>

      <Card className="overflow-hidden border-neutral-800 bg-neutral-900/80">
        <CardHeader className="relative pb-4">
          <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-neutral-100 tracking-tight">
                  {driver?.first_name ?? "—"} {driver?.last_name ?? ""}
                </h2>
                {driver?.status && driver.status !== "draft" && (
                  <Badge
                    variant="outline"
                    className={driverStatusColors[driver.status]}
                  >
                    {driverStatusLabels[driver.status] || driver.status}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                Dossier chauffeur
              </p>
              <span className="inline-block mt-2 px-2 py-1 bg-neutral-800/80 text-neutral-500 text-xs rounded-md border border-neutral-700/50 font-mono">
                ID: {driver?.id}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              {editing ? (
                <>
                  <Button
                    onClick={saveDriver}
                    disabled={saving}
                    size="sm"
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
                    className="border-neutral-700 hover:bg-neutral-800"
                  >
                    Annuler
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)} size="sm">
                  <Pencil className="h-4 w-4 mr-2" aria-hidden />
                  Modifier le profil
                </Button>
              )}
            </div>
          </div>

          <div className="relative mt-6 pt-4 border-t border-neutral-800">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-sm font-medium text-neutral-300">
                  {completionLabel}
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {completeness
                    ? `${canSubmitReady ? "Prêt à soumettre" : "Soumission incomplète"} · ${
                        isOpsComplete
                          ? "Opérationnel"
                          : "Pas encore opérationnel (docs approuvés + valides)"
                      }`
                    : completenessError
                      ? "Vérification distante indisponible"
                      : "Chargement de la complétion…"}
                </p>
                {completeness && completion !== undefined && completion < 100 && (
                  <p className="text-xs text-yellow-400/80 mt-0.5">
                    Le dossier nécessite votre attention
                  </p>
                )}
                {completenessError && completeness?.source === "local" && (
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    Vérification serveur indisponible — estimation affichée.
                  </p>
                )}
              </div>
              <span className="text-lg font-bold text-neutral-100">
                {completion === undefined ? "—" : `${Math.round(completion)}%`}
              </span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2 border border-neutral-700/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (completion ?? 0) >= 100
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
                style={{ width: `${Math.min(100, completion ?? 0)}%` }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => setActiveSection(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors border ${
                activeSection === i
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      <Card className="border-neutral-800">
        <CardContent className="pt-6">
          {activeSection === 0 && renderProfil()}
          {activeSection === 1 && renderProfessionnel()}
          {activeSection === 2 && renderDocuments()}
          {activeSection === 3 && renderValidation()}
        </CardContent>
      </Card>
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
              <label className="text-sm text-neutral-400 mb-1 block">
                {f.label}
              </label>
              {editing ? (
                <Input
                  type={f.type}
                  value={(form[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="bg-neutral-700 border-neutral-600 text-white"
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
              <label className="text-sm text-neutral-400 mb-1 block">
                {f.label}
              </label>
              {editing ? (
                <Input
                  type={f.type}
                  value={(form[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
              ) : (
                <div className="text-white">
                  {(driver?.[f.key] as string) || "-"}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-700">
          <span className="text-sm text-neutral-400 mb-2 block">
            Statut actuel
          </span>
          <Badge
            variant="outline"
            className={driverStatusColors[driver?.status ?? "draft"]}
          >
            {driverStatusLabels[driver?.status ?? "draft"]}
          </Badge>
          {driver?.status === "pending_review" && (
            <p className="text-xs text-neutral-500 mt-2">
              Tant que le dossier est en attente, utilisez les actions en bas de
              page pour activer, rejeter ou renvoyer le chauffeur en correction.
              « Renvoyer pour correction » remet le dossier en brouillon sans
              rejet formel.
            </p>
          )}
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
        <p className="text-sm text-neutral-400 mb-4">
          Vérifiez la date pré-saisie par le chauffeur (corrigible ci-dessous)
          avant d&apos;approuver. Un document sans date valide ne peut pas être
          approuvé.
        </p>
        <div className="space-y-4">
          {REQUIRED_DOCUMENTS.map((docType) => {
            const typeDocs = docsByType.get(docType) ?? [];
            const latest = typeDocs[0];
            const inputId = `admin-upload-${docType}`;
            return (
              <div key={docType} className="p-4 bg-neutral-700 rounded-lg">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="font-medium text-white">
                    {DOC_LABELS[docType] ?? docType}
                  </span>
                  {latest && (
                    <Badge
                      variant="outline"
                      className={
                        docStatusColors[latest.validation_status ?? ""] ||
                        "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"
                      }
                    >
                      {docStatusLabels[latest.validation_status ?? ""] ??
                        latest.validation_status}
                    </Badge>
                  )}
                </div>
                {!latest ? (
                  <div className="flex items-center justify-between gap-3 bg-neutral-800 p-3 rounded">
                    <div className="text-sm text-neutral-400">Aucun document</div>
                    <DocumentActionBar
                      docType={docType}
                      inputId={inputId}
                      uploading={uploadingType === docType}
                      onValidate={validateDoc}
                      onFileSelected={(file) =>
                        void uploadAdminDocument(docType, file)
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-neutral-800 p-3 rounded">
                    <DocumentPreview
                      doc={latest}
                      signedUrl={signedUrls[latest.id]}
                    />

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="text-white text-sm">
                        {latest.file_name ?? "-"}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {latest.upload_date
                          ? new Date(latest.upload_date).toLocaleString()
                          : "-"}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={`doc-expiry-${latest.id}`}
                          className="text-xs text-neutral-400 shrink-0"
                        >
                          Date de fin (pré-saisie chauffeur)
                        </label>
                        <Input
                          id={`doc-expiry-${latest.id}`}
                          type="date"
                          defaultValue={latest.expiry_date ?? ""}
                          key={`${latest.id}-${latest.expiry_date ?? "none"}`}
                          className="bg-neutral-900 border-neutral-600 text-white h-8 w-auto text-sm"
                          onBlur={(e) => {
                            const next = e.target.value;
                            if (
                              next &&
                              next !== (latest.expiry_date ?? "")
                            ) {
                              void saveDocExpiry(latest.id, next);
                            }
                          }}
                        />
                        {latest.expiry_date &&
                          new Date(latest.expiry_date) <
                            new Date(new Date().toDateString()) && (
                            <Badge
                              variant="outline"
                              className="bg-red-500/20 text-red-400 border-red-500/30"
                            >
                              Expiré
                            </Badge>
                          )}
                        {latest.expiry_date &&
                          (() => {
                            const days =
                              (new Date(latest.expiry_date).getTime() -
                                new Date().setHours(0, 0, 0, 0)) /
                              86400000;
                            return days >= 0 && days <= 30 ? (
                              <Badge
                                variant="outline"
                                className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              >
                                Expire bientôt
                              </Badge>
                            ) : null;
                          })()}
                      </div>
                      {latest.rejection_reason && (
                        <div className="text-xs text-red-400">
                          Motif rejet: {latest.rejection_reason}
                        </div>
                      )}
                    </div>

                    <DocumentActionBar
                      doc={latest}
                      docType={docType}
                      inputId={inputId}
                      uploading={uploadingType === docType}
                      onValidate={validateDoc}
                      onFileSelected={(file) =>
                        void uploadAdminDocument(docType, file)
                      }
                    />
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
    const completionPct = completeness?.completion_percentage;
    const missingFields = completeness?.missing_fields ?? [];
    const missingForSubmit = completeness?.missing_for_submit ?? [];
    const submitSet = new Set(missingForSubmit);
    const adminOnlyMissing = missingFields.filter((f) => !submitSet.has(f));
    const remoteLabel =
      completeness?.source === "rpc"
        ? "Vérification automatique"
        : completeness?.source === "local"
          ? "Estimation locale (serveur indisponible)"
          : "Vérification indisponible";

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Validation du dossier
        </h3>

        {/* Completeness summary for admin review */}
        <div
          className={`p-4 rounded-lg mb-6 border ${
            completeness && isComplete
              ? "bg-green-900/20 border-green-700"
              : "bg-yellow-900/20 border-yellow-700"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">
              {completeness && isComplete ? "✅" : "⚠️"}
            </span>
            <div>
              <div className="font-semibold text-white">
                {!completeness
                  ? "Complétion inconnue"
                  : isComplete
                    ? "Dossier complet"
                    : "Dossier incomplet"}
              </div>
              <div className="text-sm text-neutral-400">
                {remoteLabel}
                {completionPct === undefined
                  ? ""
                  : ` — ${completionPct}% complété`}
              </div>
            </div>
          </div>

          {missingForSubmit.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-amber-300 mb-2">
                À faire par le chauffeur
              </div>
              <ul className="space-y-1">
                {missingForSubmit.map((f) => (
                  <li
                    key={`submit-${f}`}
                    className="text-sm text-amber-200 flex items-center gap-2"
                  >
                    <span>•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {adminOnlyMissing.length > 0 && (
            <div>
              <div className="text-sm font-medium text-yellow-300 mb-2">
                Revue admin / ops
              </div>
              <ul className="space-y-1">
                {adminOnlyMissing.map((f) => (
                  <li
                    key={`ops-${f}`}
                    className="text-sm text-red-400 flex items-center gap-2"
                  >
                    <span>•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions sur le dossier */}
        <div className="pt-4 border-t border-neutral-700">
          <span className="text-sm text-neutral-400 mb-2 block">
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void cancelPendingReview()}
                  className="border-amber-600 text-amber-300 hover:bg-amber-900/30"
                >
                  ↩ Renvoyer pour correction
                </Button>
              </>
            )}
            {driver?.status !== "pending_review" && (
              <p className="text-xs text-neutral-500">
                L&apos;activation ou le rejet du dossier est disponible
                uniquement lorsque le statut est «{" "}
                {driverStatusLabels.pending_review} ».
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* calculateCompletion removed — header uses check_driver_profile_completeness RPC */
}

// Extracted components to reduce cognitive complexity and nesting

function DocumentPreview({
  doc,
  signedUrl,
}: Readonly<{
  doc: DriverDocRow;
  signedUrl?: string;
}>) {
  const [open, setOpen] = useState(false);
  const isImage = isImageFileRef(doc.file_name) || isImageFileRef(doc.file_url);
  const title = DOC_LABELS[doc.document_type] ?? doc.document_type;

  if (!signedUrl) {
    return (
      <div className="w-20 h-20 flex items-center justify-center rounded border border-neutral-600 bg-neutral-700 text-neutral-500 text-xs flex-shrink-0">
        —
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Agrandir"
        className="relative group w-20 h-20 flex-shrink-0 rounded border border-neutral-600 overflow-hidden bg-neutral-700 hover:ring-2 hover:ring-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        {isImage ? (
          <img
            src={signedUrl}
            alt={doc.file_name ?? doc.document_type}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-neutral-300">Voir</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-5 w-5 text-white" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(96vw,1100px)] w-full p-0 gap-0 overflow-hidden bg-neutral-950 border-neutral-700 text-white">
          <DialogHeader className="px-4 py-3 border-b border-neutral-800 pr-12">
            <DialogTitle className="text-base text-white truncate">
              {title}
              {doc.file_name ? (
                <span className="ml-2 text-sm font-normal text-neutral-400">
                  {doc.file_name}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          {isImage ? (
            <DocumentZoomViewer src={signedUrl} alt={doc.file_name ?? title} />
          ) : (
            <div className="p-6 flex flex-col items-center gap-4">
              <p className="text-sm text-neutral-400">
                Aperçu non disponible pour ce type de fichier.
              </p>
              <Button asChild variant="secondary">
                <a href={signedUrl} target="_blank" rel="noreferrer" download>
                  Télécharger / ouvrir
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 6;
const ZOOM_STEP = 0.25;

function DocumentZoomViewer({
  src,
  alt,
}: Readonly<{ src: string; alt: string }>) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const clampZoom = useCallback(
    (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)),
    [],
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetView();
  }, [src, resetView]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => clampZoom(z + delta));
    },
    [clampZoom],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-neutral-800 bg-neutral-900/80">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
          aria-label="Zoom arrière"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs tabular-nums text-neutral-300 w-14 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
          aria-label="Zoom avant"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={resetView}
          className="text-neutral-300"
          aria-label="Réinitialiser"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
        <span className="hidden sm:inline text-xs text-neutral-500 ml-2">
          Molette pour zoomer · glisser pour déplacer
        </span>
      </div>

      <div
        ref={viewportRef}
        className="relative h-[min(75dvh,720px)] overflow-hidden bg-black cursor-grab active:cursor-grabbing touch-none"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() =>
          setZoom((z) => (z >= 2 ? 1 : clampZoom(z + 1)))
        }
      >
        <div
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="max-w-[min(90vw,1000px)] max-h-[min(70dvh,680px)] w-auto h-auto object-contain select-none pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}

function DelayedTooltip({
  label,
  children,
  delayMs = 2000,
}: Readonly<{
  label: string;
  children: React.ReactNode;
  delayMs?: number;
}>) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delayMs);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded border border-neutral-600 bg-neutral-950 px-2 py-1 text-xs text-white shadow-lg"
        >
          {label}
        </span>
      )}
    </div>
  );
}

function DocumentActionBar({
  doc,
  inputId,
  uploading,
  onValidate,
  onFileSelected,
}: Readonly<{
  doc?: DriverDocRow;
  docType?: string;
  inputId: string;
  uploading: boolean;
  onValidate: (docId: string, approve: boolean) => void;
  onFileSelected: (file: File) => void;
}>) {
  const status = doc?.validation_status ?? "";
  const canApprove = status === "pending" || status === "rejected";
  const canReject = status === "pending" || status === "approved";
  let uploadLabel = "Déposer un document";
  if (uploading) {
    uploadLabel = "Upload en cours…";
  } else if (doc) {
    uploadLabel = "Remplacer le document";
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {doc && status !== "pending_temp" && canApprove && (
        <DelayedTooltip label="Approuver">
          <Button
            type="button"
            size="icon"
            className="h-8 w-8 bg-green-600 hover:bg-green-700"
            onClick={() => onValidate(doc.id, true)}
            aria-label="Approuver"
          >
            <Check className="h-4 w-4" />
          </Button>
        </DelayedTooltip>
      )}
      {doc && status !== "pending_temp" && canReject && (
        <DelayedTooltip label="Rejeter">
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            onClick={() => onValidate(doc.id, false)}
            aria-label="Rejeter"
          >
            <X className="h-4 w-4" />
          </Button>
        </DelayedTooltip>
      )}
      <DelayedTooltip label={uploadLabel}>
        <label
          htmlFor={inputId}
          aria-label={uploadLabel}
          className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-neutral-500 bg-neutral-700 text-neutral-200 hover:bg-neutral-600 ${
            uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </label>
      </DelayedTooltip>
      <input
        id={inputId}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFileSelected(file);
        }}
      />
    </div>
  );
}
