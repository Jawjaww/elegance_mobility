"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";

export default function DriverDocumentsAdmin() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('driver_documents')
      .select('id, driver_id, document_type, file_name, validation_status, upload_date, validated_by, validated_at')
      .order('upload_date', { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setDocs(data ?? []);
    }
    setLoading(false);
  }

  async function validate(docId: string, approve: boolean) {
    try {
      const { data, error } = await supabase.rpc('validate_driver_document', { p_document_id: docId, p_approve: approve });
      if (error) throw error;
      toast({ title: approve ? 'Document approuvé' : 'Document rejeté' });
      fetchDocs();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erreur', description: e.message || String(e), variant: 'destructive' });
    }
  }

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Validation des documents chauffeurs</h2>
      <div className="space-y-3">
        {docs.map((d) => (
          <div key={d.id} className="p-3 bg-slate-800 rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{d.file_name} — {d.document_type}</div>
              <div className="text-xs text-slate-400">Statut: {d.validation_status} — téléchargé: {new Date(d.upload_date).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => validate(d.id, true)} variant="ghost">Approuver</Button>
              <Button onClick={() => validate(d.id, false)} variant="destructive">Rejeter</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
