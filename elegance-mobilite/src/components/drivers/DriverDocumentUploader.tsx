"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/database/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";

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
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const hasDriver = driverId && driverId.trim().length > 0;

  useEffect(() => {
    if (!hasDriver) return;
    fetchExisting();
  }, [hasDriver]);

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
          if (!signedErr && signed?.signedUrl) setExistingUrl(signed.signedUrl);
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
    } else {
      setPreviewUrl(null);
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
      
      if (!hasDriver) {
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

        setDocRecord({
          file_url: uploadData.path,
          file_name: file.name,
          validation_status: "pending_temp",
          temp: true,
        });
        
        toast({ title: "Fichier uploadé temporairement", description: "Le fichier sera associé à votre profil après sa création." });
        onUploaded?.({ tempPath: uploadData.path });
        setUploading(false);
        return;
      }

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
      
      const { data: signed } = await supabase.storage
        .from("driver-documents")
        .createSignedUrl(uploadData.path, 60 * 60 * 24);
      
      if (signed?.signedUrl) setPreviewUrl(signed.signedUrl);
      
      toast({ title: "Fichier uploadé", description: "Le fichier est en attente de validation." });
      onUploaded?.(insertData);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erreur", description: e.message || String(e), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || existingUrl;
  const isImage = displayUrl && docRecord?.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPending = docRecord?.validation_status === "pending" || docRecord?.validation_status === "pending_temp";
  const isApproved = docRecord?.validation_status === "approved";

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-white/[0.05]">
            {isApproved ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : isPending ? (
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Upload className="h-3.5 w-3.5 text-slate-500" />
            )}
          </div>
          <div>
            <div className="text-xs font-medium text-white">{label ?? documentType}</div>
            <div className="text-[10px] text-slate-500">
              {docRecord 
                ? `${docRecord.file_name} • ${isApproved ? "Validé" : isPending ? "En attente" : "Rejeté"}`
                : "Aucun fichier"}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button 
            type="button"
            variant="ghost" 
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-[10px] text-slate-400 hover:text-white hover:bg-white/[0.05] h-7 px-2"
          >
            {file ? "Changer" : "Choisir"}
          </Button>
          {file && (
            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] px-2"
            >
              {uploading ? "..." : "Envoyer"}
            </Button>
          )}
        </div>
      </div>

      {displayUrl && (
        <div className="px-3 pb-3">
          {isImage ? (
            <a href={displayUrl} target="_blank" rel="noreferrer" className="inline-block">
              <img 
                src={displayUrl} 
                alt={docRecord?.file_name} 
                className="h-14 rounded object-cover opacity-80 hover:opacity-100 transition-opacity" 
              />
            </a>
          ) : (
            <a 
              href={displayUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[10px] text-blue-400/70 hover:text-blue-400 flex items-center gap-1"
            >
              <FileText className="h-3 w-3" />
              Voir le fichier
            </a>
          )}
        </div>
      )}
    </div>
  );
}
