"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";

const DOC_TYPES = [
  "vtc_card",
  "driving_license",
  "insurance",
  "vehicle_registration",
  "medical_certificate",
  "background_check",
  "photo_id",
  "other",
];

const VALIDATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "expired",
];

export default function DriverDocumentsAdmin({
  driverId,
}: Readonly<{
  driverId?: string;
}>) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Edit modal state
  const [editingDoc, setEditingDoc] = useState<Record<string, unknown> | null>(null);
  const [editForm, setEditForm] = useState<{
    document_type: string;
    file_name: string;
    file_url: string;
    validation_status: string;
    rejection_reason: string;
  }>({
    document_type: "",
    file_name: "",
    file_url: "",
    validation_status: "",
    rejection_reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    try {
      let q: any = supabase
        .from("driver_documents")
        .select(
          "id, driver_id, document_type, file_name, file_url, file_size, validation_status, upload_date, validated_by, validated_at, rejection_reason",
        );

      if (driverId) q = q.eq("driver_id", driverId);

      q = q.order("upload_date", { ascending: false }).limit(200);

      const { data, error } = await q;

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setDocs(data ?? []);
      }
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message || String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function validate(docId: string, approve: boolean) {
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
      fetchDocs();
    } catch (e: any) {
      console.warn("DriverDocumentsAdmin.validate error:", e);
      const msg =
        e?.message ?? (typeof e === "object" ? JSON.stringify(e) : String(e));
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  }

  function openEdit(doc: any) {
    setEditingDoc(doc);
    setEditForm({
      document_type: doc.document_type ?? "",
      file_name: doc.file_name ?? "",
      file_url: doc.file_url ?? "",
      validation_status: doc.validation_status ?? "pending",
      rejection_reason: doc.rejection_reason ?? "",
    });
  }

  async function saveEdit() {
    if (!editingDoc) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("driver_documents")
        .update({
          document_type: editForm.document_type,
          file_name: editForm.file_name,
          file_url: editForm.file_url,
          validation_status: editForm.validation_status,
          rejection_reason: editForm.rejection_reason || null,
        })
        .eq("id", editingDoc.id);
      if (error) throw error;
      toast({ title: "Document mis à jour" });
      setEditingDoc(null);
      fetchDocs();
    } catch (e: any) {
      console.warn("DriverDocumentsAdmin.saveEdit error:", e);
      const msg =
        e?.message ?? (typeof e === "object" ? JSON.stringify(e) : String(e));
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteDoc(docId: string) {
    const confirmed = globalThis.confirm(
      "Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.",
    );
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from("driver_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
      toast({ title: "Document supprimé" });
      fetchDocs();
    } catch (e: any) {
      console.warn("DriverDocumentsAdmin.deleteDoc error:", e);
      const msg =
        e?.message ?? (typeof e === "object" ? JSON.stringify(e) : String(e));
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  }

  async function downloadDoc(doc: any) {
    if (!doc.file_url) {
      toast({ title: "Aucun fichier", description: "Ce document n'a pas de fichier associé.", variant: "destructive" });
      return;
    }
    setDownloading(doc.id);
    try {
      let url = doc.file_url;
      // If it's a storage path (not http), generate a signed URL
      if (!doc.file_url.startsWith("http")) {
        const { data, error } = await supabase.storage
          .from("driver-documents")
          .createSignedUrl(doc.file_url, 3600);
        if (error) throw error;
        url = data?.signedUrl;
      }
      if (!url) throw new Error("Impossible de générer l'URL de téléchargement");

      // Open in new tab or trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.file_name || "document";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "Téléchargement lancé" });
    } catch (e: any) {
      console.warn("DriverDocumentsAdmin.downloadDoc error:", e);
      const msg =
        e?.message ?? (typeof e === "object" ? JSON.stringify(e) : String(e));
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  }

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Validation des documents chauffeurs
      </h2>
      <div className="space-y-3">
        {docs.map((d) => (
          <div
            key={d.id}
            className="p-3 bg-gray-800 rounded flex items-center justify-between"
          >
            <div>
              <div className="font-medium">
                {d.file_name} — {d.document_type}
              </div>
              <div className="text-xs text-gray-400">
                Statut: {d.validation_status} — téléchargé:{" "}
                {d.upload_date ? new Date(d.upload_date).toLocaleString() : "-"}
              </div>
              {d.validated_by && (
                <div className="text-xs text-gray-400">
                  Validé par: {d.validated_by} le{" "}
                  {d.validated_at
                    ? new Date(d.validated_at).toLocaleString()
                    : "-"}
                </div>
              )}
              {d.rejection_reason && (
                <div className="text-xs text-red-400">
                  Motif rejet: {d.rejection_reason}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => downloadDoc(d)}
                variant="secondary"
                size="sm"
                disabled={downloading === d.id}
              >
                {downloading === d.id ? "⏳" : "📥"} Télécharger
              </Button>
              <Button onClick={() => openEdit(d)} variant="outline" size="sm">
                Modifier
              </Button>
              <Button onClick={() => validate(d.id, true)} variant="ghost" size="sm">
                Approuver
              </Button>
              <Button
                onClick={() => validate(d.id, false)}
                variant="destructive"
                size="sm"
              >
                Rejeter
              </Button>
              <Button
                onClick={() => deleteDoc(d.id)}
                variant="destructive"
                size="sm"
              >
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Type de document</Label>
              <Select
                value={editForm.document_type}
                onValueChange={(v) => setEditForm({ ...editForm, document_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nom du fichier</Label>
              <Input
                value={editForm.file_name}
                onChange={(e) => setEditForm({ ...editForm, file_name: e.target.value })}
              />
            </div>
            <div>
              <Label>URL du fichier</Label>
              <Input
                value={editForm.file_url}
                onChange={(e) => setEditForm({ ...editForm, file_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Statut de validation</Label>
              <Select
                value={editForm.validation_status}
                onValueChange={(v) => setEditForm({ ...editForm, validation_status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {VALIDATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motif de rejet</Label>
              <Input
                value={editForm.rejection_reason}
                onChange={(e) => setEditForm({ ...editForm, rejection_reason: e.target.value })}
                placeholder="Optionnel"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>
              Annuler
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
