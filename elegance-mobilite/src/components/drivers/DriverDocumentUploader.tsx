"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

type Props = {
  driverId: string;
  documentType: string;
  label?: string;
  accept?: string;
  onUploaded?: (record: any) => void;
};

export default function DriverDocumentUploader({
  driverId,
  documentType,
  label,
  accept = "image/*,application/pdf",
  onUploaded,
}: Props) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docRecord, setDocRecord] = useState<any | null>(null);

  useEffect(() => {
    if (!driverId) return;
    fetchExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  async function fetchExisting() {
    try {
      const { data, error } = await supabase
        .from("driver_documents")
        .select("*")
        .eq("driver_id", driverId)
        .eq("document_type", documentType)
        .order("upload_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("fetchExisting doc error", error);
        return;
      }

      if (data) {
        setDocRecord(data);
        if (data.file_url) {
          const { data: signed, error: signedErr } = await supabase.storage
            .from("driver-documents")
            .createSignedUrl(data.file_url, 60 * 60);
          if (!signedErr && signed?.signedUrl) setPreviewUrl(signed.signedUrl);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Aucun fichier sélectionné" });
      return;
    }
    setUploading(true);

    try {
      const safeName = file.name.replace(/\s+/g, "_");
      // If driverId not present, upload to a temporary folder under the user's tmp/ prefix
      if (!driverId) {
        // get current user id
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        const userId = userData?.user?.id ?? null;
        if (!userId) {
          toast({ title: "Vous devez être connecté pour uploader." });
          setUploading(false);
          return;
        }

        const tmpPath = `tmp/${userId}/${documentType}/${Date.now()}_${safeName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("driver-documents")
          .upload(tmpPath, file, { upsert: true });

        if (uploadError) {
          console.error("tmp uploadError", uploadError);
          toast({ title: "Erreur upload", description: uploadError.message, variant: "destructive" });
          setUploading(false);
          return;
        }

        const { data: signed, error: signedErr } = await supabase.storage
          .from("driver-documents")
          .createSignedUrl(uploadData.path, 60 * 60 * 24);

        setDocRecord({
          file_url: uploadData.path,
          file_name: file.name,
          file_size: file.size,
          upload_date: new Date().toISOString(),
          validation_status: "pending_temp",
          temp: true,
        });

        if (!signedErr && signed?.signedUrl) setPreviewUrl(signed.signedUrl);
        toast({ title: "Fichier uploadé temporairement", description: "Le fichier sera associé à votre profil après sa création." });
        onUploaded?.({ tempPath: uploadData.path });
        setUploading(false);
        return;
      }

      // Normal upload (driver exists): upload to driver's folder and create DB record
      const path = `${driverId}/${documentType}/${Date.now()}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("driver-documents")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.error("uploadError", uploadError);
        toast({ title: "Erreur upload", description: uploadError.message, variant: "destructive" });
        setUploading(false);
        return;
      }

      // create signed url for preview
      const { data: signed, error: signedErr } = await supabase.storage
        .from("driver-documents")
        .createSignedUrl(uploadData.path, 60 * 60 * 24);

      // insert DB record (store path in file_url)
      const { data: insertData, error: insertErr } = await supabase
        .from("driver_documents")
        .insert([
          {
            driver_id: driverId,
            document_type: documentType,
            file_url: uploadData.path,
            file_name: file.name,
            file_size: file.size,
            upload_date: new Date().toISOString(),
            validation_status: "pending",
          },
        ])
        .select()
        .maybeSingle();

      if (insertErr) {
        console.error("insertErr", insertErr);
        toast({ title: "Erreur enregistrement", description: insertErr.message, variant: "destructive" });
        setUploading(false);
        return;
      }

      setDocRecord(insertData ?? null);
      if (signed && signed.signedUrl) setPreviewUrl(signed.signedUrl);
      toast({ title: "Fichier uploadé", description: "Le fichier est en attente de validation." });
      onUploaded?.(insertData);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erreur", description: e.message || String(e), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-800 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-slate-100">{label ?? documentType}</div>
          <div className="text-xs text-slate-400">{docRecord ? `Statut: ${docRecord.validation_status}` : "Aucun fichier"}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id={`input-${documentType}`}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor={`input-${documentType}`}>
            <Button variant="ghost">Choisir</Button>
          </label>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Upload..." : "Uploader"}
          </Button>
        </div>
      </div>

      {previewUrl && (
        <div className="mt-3">
          {docRecord && docRecord.file_name && docRecord.file_name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            // image preview
            <img src={previewUrl} alt={docRecord.file_name} className="max-h-40 rounded" />
          ) : (
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-300">
              Voir le document
            </a>
          )}
        </div>
      )}
    </div>
  );
}
