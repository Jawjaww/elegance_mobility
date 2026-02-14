"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/database/client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseStorageClient(): SupabaseClient | null {
  // Only create the storage client in the browser (avoid SSR issues)
  if (typeof window === "undefined") return null;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || "";
  // Ensure we pass the project root (no /storage/v1 suffix)
  let base = rawUrl.replace(/\/+$/g, "");
  base = base.replace(/\/storage\/v1\/?$/i, "");

  const anon = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ANON_KEY || "";
  if (!base || !anon) return null;

  // Avoid creating a browser storage client when the supplied key looks like a publishable/access token
  // (these tokens often start with sb_publishable_ or sbp_ and will cause 'Invalid Compact JWS' errors)
  if (/^(sb_publishable_|sbp_)/i.test(anon)) {
    console.warn('Refusing to create browser storage client: NEXT_PUBLIC_SUPABASE_STORAGE_ANON_KEY looks like a publishable/access token');
    return null;
  }

  try {
    return createClient(base, anon, { auth: { persistSession: false } });
  } catch (err) {
    // don't crash the app, return null so callers can handle it
    // console.error intentionally left for debugging
    // (avoid exposing keys in logs)
    console.error("Failed creating supabase storage client", err);
    return null;
  }
}

// Sanitize filenames for storage keys: remove diacritics, replace unsafe chars
function sanitizeFileName(name: string) {
  if (!name) return 'file'
  try {
    // Normalize diacritics (NFKD) then strip combining marks
    const normalized = name.normalize('NFKD').replace(/['"`]/g, '').replace(/[\u0300-\u036f]/g, '')
    // Keep only a safe subset of chars and collapse runs of underscores
    return normalized.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 240) || 'file'
  } catch (e) {
    return name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '_').slice(0, 240) || 'file'
  }
}

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

  function friendlyUploadErrorMessage(uploadError: any) {
    const msg = uploadError?.message || uploadError?.error || String(uploadError);
    if (msg?.toString().includes("Bucket not found")) {
      return "Bucket non trouvé. Vérifiez que le bucket 'driver-documents' existe dans votre projet Supabase distant.";
    }
    if (msg?.toString().includes("Invalid Compact JWS") || msg?.toString().toLowerCase().includes("unauthorized")) {
      return "Clé API invalide ou mal formée. Vérifiez NEXT_PUBLIC_SUPABASE_STORAGE_ANON_KEY (utilisez la clé 'anon public' du dashboard Supabase) et assurez-vous qu'elle ne contient pas de préfixe 'Bearer ' ni de guillemets.";
    }
    return msg;
  }

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
        const storageClient = getSupabaseStorageClient();
        if (storageClient) {
          try {
            const { data: signed, error: signedErr } = await storageClient.storage
              .from("driver-documents")
              .createSignedUrl(data.file_url, 60 * 60);
            if (!signedErr && signed?.signedUrl) setExistingUrl(signed.signedUrl);
          } catch (e) {
            console.warn("Failed to create signed url via client storage", e);
          }
        } else {
          // Fallback: try server endpoint which will use service role to create a signed url
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token ?? null;
            const resp = await fetch('/api/upload?op=signed&path=' + encodeURIComponent(data.file_url), {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (resp.ok) {
              const json = await resp.json();
              if (json?.signedUrl) setExistingUrl(json.signedUrl);
            }
          } catch (e) {
            console.warn("Supabase storage client not configured - cannot create signed URL", e);
          }
        }
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
      const safeName = sanitizeFileName(file.name);
      
      if (!hasDriver) {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        const userId = userData?.user?.id ?? null;
        if (!userId) {
          toast({ title: "Vous devez être connecté pour uploader." });
          setUploading(false);
          return;
        }

        const tmpPath = `tmp/${userId}/${documentType}/${Date.now()}_${safeName}`;
        const storageClient = getSupabaseStorageClient();
        if (storageClient) {
          try {
            const { data: uploadData, error: uploadError } = await storageClient.storage
              .from("driver-documents")
              .upload(tmpPath, file, { upsert: true });

            if (uploadError) throw uploadError;

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
          } catch (err) {
            console.warn('Client storage upload failed, falling back to server upload', err);
          }
        }

        // fallback to server-side upload
        try {
          const form = new FormData();
          form.append('file', file as any);
          form.append('document_type', documentType);
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token ?? null;
          const resp = await fetch('/api/upload', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
          const json = await resp.json().catch(() => null);
          if (!resp.ok) {
            throw new Error(json?.error || `Upload failed with status ${resp.status}`);
          }

          const insertPath = json.path ?? json.insert?.file_url ?? null;
          setDocRecord({
            file_url: insertPath,
            file_name: file.name,
            validation_status: 'pending_temp',
            temp: true,
          });

          toast({ title: 'Fichier uploadé temporairement', description: 'Le fichier sera associé à votre profil après sa création.' });
          onUploaded?.({ tempPath: insertPath });
          setUploading(false);
          return;
        } catch (err: any) {
          console.error('tmp upload error (server)', err);
          toast({ title: 'Erreur upload', description: friendlyUploadErrorMessage(err), variant: 'destructive' });
          setUploading(false);
          return;
        }
      }

      const path = `${driverId}/${documentType}/${Date.now()}_${safeName}`;

      const storageClient = getSupabaseStorageClient();
      if (storageClient) {
        try {
          const { data: uploadData, error: uploadError } = await storageClient.storage
            .from("driver-documents")
            .upload(path, file, { upsert: true });

          if (uploadError) throw uploadError;

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

          if (insertErr) throw insertErr;

          setDocRecord(insertData ?? null);

          try {
            const { data: signed } = await storageClient.storage
              .from("driver-documents")
              .createSignedUrl(uploadData.path, 60 * 60 * 24);
            if (signed?.signedUrl) setPreviewUrl(signed.signedUrl);
          } catch (e) {
            console.warn('Could not create signed url via client', e);
          }

          toast({ title: "Fichier uploadé", description: "Le fichier est en attente de validation." });
          onUploaded?.(insertData);
          setUploading(false);
          return;
        } catch (err) {
          console.warn('Client storage upload failed, falling back to server upload', err);
          // continue to server upload fallback
        }
      }

      // fallback to server upload
      try {
        const form = new FormData();
        form.append('file', file as any);
        form.append('document_type', documentType);
        if (driverId) form.append('driver_id', driverId);
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token ?? null;
        const resp = await fetch('/api/upload', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const json = await resp.json().catch(() => null);
        if (!resp.ok) {
          throw new Error(json?.error || `Upload failed with status ${resp.status}`);
        }

        const inserted = json.insert ?? null;
        setDocRecord(inserted ?? { file_url: json.path, file_name: file.name, validation_status: 'pending' });
        if (json.signedUrl) setPreviewUrl(json.signedUrl);
        toast({ title: 'Fichier uploadé', description: 'Le fichier est en attente de validation.' });
        onUploaded?.(inserted ?? { file_url: json.path });
      } catch (err: any) {
        console.error('upload error (server)', err);
        toast({ title: 'Erreur upload', description: friendlyUploadErrorMessage(err), variant: 'destructive' });
      }
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
