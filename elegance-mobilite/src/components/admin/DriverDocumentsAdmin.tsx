"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

export default function DriverDocumentsAdmin({
  driverId,
}: {
  driverId?: string;
}) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
    return;
  }

  async function validate(docId: string, approve: boolean) {
    try {
      let reason: string | null = null;
      if (!approve) {
        reason = window.prompt("Motif du rejet (optionnel) :") || null;
        if (reason === "") reason = null;
      }
      const { data, error } = await supabase.rpc("validate_driver_document", {
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
              <Button onClick={() => validate(d.id, true)} variant="ghost">
                Approuver
              </Button>
              <Button
                onClick={() => validate(d.id, false)}
                variant="destructive"
              >
                Rejeter
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
