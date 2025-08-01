import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { getSignedUrlFromPublicUrl, extractFilePathFromUrl } from '@/lib/supabase-storage-setup'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle,
  Camera,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  File
} from 'lucide-react'

interface FileUploadProps {
  driverId: string
  fileType: 'avatar' | 'document' | 'vehicle_photo'
  documentType?: string
  onUploadComplete: (url: string) => void
  acceptedTypes?: string
  maxSize?: number // en MB
  children?: React.ReactNode
  currentFile?: {
    url: string
    name?: string
    size?: number
  }
}

interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
  uploadedAt: Date
}

export function FileUpload({ 
  driverId, 
  fileType, 
  documentType,
  onUploadComplete,
  acceptedTypes = "image/*,.pdf",
  maxSize = 10,
  children,
  currentFile 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Récupérer le document existant depuis la base de données
  const fetchExistingDocument = useCallback(async () => {
    if (fileType === 'document' && documentType) {
      try {
        const { data: existingDoc, error } = await supabase
          .from('driver_documents')
          .select('file_url, file_name, file_size')
          .eq('driver_id', driverId)
          .eq('document_type', documentType)
          .maybeSingle()

        if (error) {
          console.error('Erreur récupération document:', error)
          return
        }

        if (existingDoc) {
          // Pour les documents privés, utiliser directement le chemin stocké pour régénérer une URL signée
          let displayUrl = existingDoc.file_url
          
          if (getBucketName() === 'driver-documents') {
            try {
              // Extraire le chemin depuis l'URL stockée
              const filePath = extractFilePathFromUrl(existingDoc.file_url, 'driver-documents')
              if (filePath) {
                console.log('🔍 Génération URL signée pour chemin:', filePath)
                const { data, error } = await supabase.storage
                  .from('driver-documents')
                  .createSignedUrl(filePath, 3600)
                
                if (data && !error) {
                  displayUrl = data.signedUrl
                  console.log('✅ URL signée générée avec succès')
                } else {
                  console.warn('❌ Erreur génération URL signée:', error)
                }
              }
            } catch (urlError) {
              console.warn('❌ Erreur génération URL signée:', urlError)
              // Utiliser l'URL originale en cas d'erreur
            }
          }

          setUploadedFile({
            url: displayUrl,
            name: existingDoc.file_name || `${documentType}.pdf`,
            size: existingDoc.file_size || 0,
            type: existingDoc.file_url.includes('.pdf') ? 'application/pdf' : 'image',
            uploadedAt: new Date()
          })
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du document:', error)
      }
    }
  }, [driverId, fileType, documentType])

  // Initialiser avec le fichier actuel s'il existe ou récupérer depuis la DB
  useEffect(() => {
    if (currentFile) {
      setUploadedFile({
        url: currentFile.url,
        name: currentFile.name || 'Document',
        size: currentFile.size || 0,
        type: currentFile.url.includes('.pdf') ? 'application/pdf' : 'image',
        uploadedAt: new Date()
      })
    } else {
      // Si pas de currentFile, essayer de récupérer depuis la DB
      fetchExistingDocument()
    }
  }, [currentFile, fetchExistingDocument])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon
    if (type === 'application/pdf') return FileText
    return File
  }

  const getBucketName = () => {
    switch (fileType) {
      case 'avatar': return 'driver-avatars'
      case 'document': return 'driver-documents'
      case 'vehicle_photo': return 'vehicle-photos'
      default: return 'driver-documents'
    }
  }

  const generateFileName = (originalName: string) => {
    const timestamp = Date.now()
    const extension = originalName.split('.').pop()
    const prefix = documentType || fileType
    
    // IMPORTANT: Utiliser le format attendu par les politiques RLS Storage
    // Format: driver-documents/driverId_documentType_timestamp.extension
    return `driver-documents/${driverId}_${prefix}_${timestamp}.${extension}`
  }

  const deleteFile = useCallback(async () => {
    if (!uploadedFile) return
    
    try {
      const bucketName = getBucketName()
      
      // Extraire le chemin complet du fichier depuis l'URL
      const filePath = extractFilePathFromUrl(uploadedFile.url, bucketName)
      
      if (!filePath) {
        throw new Error('Impossible de trouver le chemin du fichier')
      }
      
      console.log('🗑️ Suppression du fichier:', filePath, 'dans le bucket:', bucketName)
      
      // Supprimer de Supabase Storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath])
      
      if (error) {
        console.error('Erreur Storage:', error)
        throw error
      }
      
      // Mettre à jour la base de données selon le type
      if (fileType === 'avatar') {
        await supabase
          .from('drivers')
          .update({ avatar_url: null })
          .eq('id', driverId)
      } else if (fileType === 'document' && documentType) {
        // Supprimer de driver_documents
        await supabase
          .from('driver_documents')
          .delete()
          .eq('driver_id', driverId)
          .eq('document_type', documentType)

        // Mettre à jour document_urls dans drivers
        const { data: driver } = await supabase
          .from('drivers')
          .select('document_urls')
          .eq('id', driverId)
          .single()

        const updatedUrls = { ...(driver?.document_urls as any || {}) }
        delete updatedUrls[documentType]

        await supabase
          .from('drivers')
          .update({ document_urls: updatedUrls })
          .eq('id', driverId)
      }
      
      setUploadedFile(null)
      onUploadComplete('')
      
      toast({
        title: "🗑️ Fichier supprimé",
        description: "Le fichier a été supprimé avec succès"
      })
      
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      toast({
        variant: "destructive",
        title: "❌ Erreur de suppression", 
        description: error.message
      })
    }
  }, [uploadedFile, driverId, fileType, documentType, onUploadComplete, toast])

  const uploadFile = useCallback(async (file: File) => {
    try {
      setUploading(true)
      setProgress(0)

      // Validation de la taille
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`Le fichier est trop volumineux (max ${maxSize}MB)`)
      }

      // Générer le nom de fichier
      const fileName = generateFileName(file.name)
      const bucketName = getBucketName()

      // Créer une preview pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      }

      // Simuler le progrès pendant l'upload
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)

      if (error) throw error

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      setProgress(100)

      // Enregistrer les informations du fichier uploadé
      setUploadedFile({
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      })

      // Mise à jour de la base de données selon le type
      if (fileType === 'avatar') {
        await supabase
          .from('drivers')
          .update({ avatar_url: publicUrl })
          .eq('id', driverId)
      } else if (fileType === 'document' && documentType) {
        // Supprimer l'ancien document s'il existe
        await supabase
          .from('driver_documents')
          .delete()
          .eq('driver_id', driverId)
          .eq('document_type', documentType)

        // Enregistrer le nouveau document dans driver_documents
        await supabase
          .from('driver_documents')
          .insert({
            driver_id: driverId,
            document_type: documentType,
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
            upload_date: new Date().toISOString(),
            validation_status: 'pending'
          })

        // Mettre à jour document_urls dans drivers pour compatibilité
        const { data: driver } = await supabase
          .from('drivers')
          .select('document_urls')
          .eq('id', driverId)
          .single()

        const updatedUrls = {
          ...(driver?.document_urls as any || {}),
          [documentType]: publicUrl
        }

        await supabase
          .from('drivers')
          .update({ document_urls: updatedUrls })
          .eq('id', driverId)
      }

      // Enregistrer les informations du fichier uploadé
      setUploadedFile({
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      })

      onUploadComplete(publicUrl)

      toast({
        title: "✅ Fichier uploadé",
        description: `${file.name} a été enregistré avec succès`
      })

    } catch (error: any) {
      console.error('Erreur upload:', error)
      toast({
        variant: "destructive",
        title: "❌ Erreur d'upload",
        description: error.message
      })
    } finally {
      setUploading(false)
      setProgress(0)
      setTimeout(() => setPreview(null), 2000)
    }
  }, [driverId, fileType, documentType, maxSize, onUploadComplete, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [uploadFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
    // Reset input pour permettre de sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadFile])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  if (children) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={uploading}
        />
        {children}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-20">
            <div className="text-white text-center">
              <Upload className="w-6 h-6 animate-pulse mx-auto mb-2" />
              <p className="text-sm">{progress}%</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Si un fichier est déjà uploadé, afficher l'interface de gestion
  if (uploadedFile) {
    const FileIcon = getFileIcon(uploadedFile.type)
    const isImage = uploadedFile.type.startsWith('image/')
    
    return (
      <div className="space-y-3">
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardContent className="p-4 space-y-4">
            {/* En-tête du fichier - Layout mobile-first */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Icon et preview */}
              <div className="flex items-center space-x-3 flex-1">
                <div className="shrink-0">
                  {isImage ? (
                    <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center overflow-hidden ring-2 ring-green-200">
                      <img 
                        src={uploadedFile.url} 
                        alt={uploadedFile.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn('Erreur chargement miniature:', uploadedFile.url)
                          // Remplacer par l'icône en cas d'erreur
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="w-7 h-7 text-green-600"><svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg></div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center ring-2 ring-blue-200">
                      <FileIcon className="w-7 h-7 text-blue-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-100 break-words">
                    {uploadedFile.name}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-neutral-400 mt-1">
                    <span className="font-medium">{formatFileSize(uploadedFile.size)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Uploadé le {uploadedFile.uploadedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Badge de statut - Responsif */}
              <div className="self-start sm:self-center">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                  <CheckCircle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">Uploadé</span>
                </Badge>
              </div>
            </div>
            
            {/* Actions - Layout mobile avec boutons empilés */}
            <div className="border-t border-neutral-700 pt-4">
              {/* Actions - Interface modernisée mobile-first */}
              <div className="space-y-3">
                {/* Action principale - Aperçu en pleine largeur */}
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="w-full h-11 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-500 transition-all"
                  title="Voir l'aperçu du document"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="font-medium">Aperçu du document</span>
                </Button>
                
                {/* Actions secondaires - Grid équilibré */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={openFileDialog}
                    className="h-11 border-blue-600/50 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500 transition-all"
                    title="Remplacer le fichier"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span className="font-medium">Remplacer</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={deleteFile}
                    className="h-11 border-red-600/50 text-red-400 hover:bg-red-900/20 hover:border-red-500 transition-all"
                    title="Supprimer le fichier"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="font-medium">Supprimer</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input caché pour le remplacement */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {/* Modal d'aperçu modernisée */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate text-neutral-900 dark:text-neutral-100">
                    {uploadedFile.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatFileSize(uploadedFile.size)} • {isImage ? 'Image' : 'Document PDF'}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="px-6 pb-6">
              {isImage ? (
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 mt-4">
                  <div className="flex justify-center">
                    <img 
                      src={uploadedFile.url} 
                      alt={uploadedFile.name}
                      className="max-w-full h-auto rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700"
                      style={{ 
                        maxHeight: '60vh',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        console.error('Erreur chargement image:', e)
                        // Fallback vers message d'erreur
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Document PDF
                    </h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Cliquez sur le bouton ci-dessous pour ouvrir le document
                    </p>
                  </div>
                  <Button 
                    onClick={() => window.open(uploadedFile.url, '_blank')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Ouvrir le document
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <Card className={`border-2 border-dashed transition-all duration-200 ${
      dragActive 
        ? 'border-blue-500 bg-blue-50/10 scale-[1.02]' 
        : 'border-neutral-600 hover:border-blue-400'
    }`}>
      <CardContent className="p-4 sm:p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="text-center space-y-4"
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 animate-pulse text-blue-600" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-200">Upload en cours...</p>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-neutral-400 font-medium">{progress}% - {preview ? 'Traitement...' : 'Envoi...'}</p>
              </div>
              {preview && (
                <div className="mt-4 flex justify-center">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg border-2 border-blue-200 shadow-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                dragActive ? 'bg-blue-500/20 scale-110 ring-4 ring-blue-500/30' : 'bg-neutral-800'
              }`}>
                {fileType === 'avatar' ? (
                  <Camera className={`w-8 h-8 transition-colors ${dragActive ? 'text-blue-400' : 'text-neutral-400'}`} />
                ) : (
                  <FileText className={`w-8 h-8 transition-colors ${dragActive ? 'text-blue-400' : 'text-neutral-400'}`} />
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-200">
                  {dragActive ? 'Déposez votre fichier ici' : 
                   fileType === 'avatar' ? 'Photo de profil' : 'Document'}
                </h3>
                <p className="text-sm text-neutral-400 px-2">
                  {dragActive ? 'Relâchez pour uploader' : 
                   'Glissez-déposez ou cliquez pour sélectionner un fichier'}
                </p>
              </div>

              {/* Action Button */}
              <Button 
                variant="outline" 
                size="lg"
                onClick={openFileDialog}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-blue-500 transition-all w-full sm:w-auto"
              >
                <Upload className="w-5 h-5 mr-2" />
                <span className="font-medium">Choisir un fichier</span>
              </Button>

              {/* File Info */}
              <div className="text-xs text-neutral-500 space-y-1 px-2">
                <p className="font-medium">
                  {acceptedTypes.includes('image') && acceptedTypes.includes('.pdf') 
                    ? 'Images (JPG, PNG) ou PDF' 
                    : acceptedTypes.includes('image') 
                    ? 'Images (JPG, PNG)' 
                    : 'Documents PDF'
                  }
                </p>
                <p>Taille maximum : {maxSize}MB</p>
              </div>
            </>
          )}
        </div>

        {/* Input caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </CardContent>
    </Card>
  )
}

// Composant Avatar Upload spécialisé
export function AvatarUpload({ 
  driverId, 
  currentAvatarUrl, 
  onUploadComplete 
}: {
  driverId: string
  currentAvatarUrl?: string | null
  onUploadComplete: (url: string) => void
}) {
  const currentFile = currentAvatarUrl ? {
    url: currentAvatarUrl,
    name: 'Avatar',
    size: 0
  } : undefined

  return (
    <FileUpload
      driverId={driverId}
      fileType="avatar"
      onUploadComplete={onUploadComplete}
      acceptedTypes="image/*"
      maxSize={5}
      currentFile={currentFile}
    >
      <div className="relative group cursor-pointer">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-4 ring-neutral-700 shadow-xl">
          {currentAvatarUrl ? (
            <img 
              src={currentAvatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-center">
            <Camera className="w-6 h-6 text-white mx-auto mb-1" />
            <p className="text-xs text-white font-medium">
              {currentAvatarUrl ? 'Changer' : 'Ajouter'}
            </p>
          </div>
        </div>
      </div>
    </FileUpload>
  )
}

// Composant Document Upload spécialisé
export function DocumentUpload({ 
  driverId, 
  documentType, 
  label,
  currentUrl,
  onUploadComplete 
}: {
  driverId: string
  documentType: string
  label: string
  currentUrl?: string | null
  onUploadComplete: (url: string) => void
}) {
  // Ne plus utiliser currentFile en prop car la récupération se fait automatiquement
  // depuis la table driver_documents dans le useEffect de FileUpload

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      
      <FileUpload
        driverId={driverId}
        fileType="document"
        documentType={documentType}
        onUploadComplete={onUploadComplete}
        acceptedTypes=".pdf,image/*"
        maxSize={10}
        // Pas de currentFile - la récupération se fait automatiquement
      />
    </div>
  )
}