import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { useToast } from '@/hooks/useToast'
import { setupStorageBuckets, getStorageUrl, getSignedUrl } from '@/lib/supabase-storage-setup'
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
  const [viewableUrl, setViewableUrl] = useState<string | null>(null) // Pour les URLs signées
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialiser avec le fichier actuel s'il existe
  useEffect(() => {
    const loadCurrentFileData = async () => {
      if (currentFile) {
        // Essayer de récupérer les vraies informations du fichier depuis la base
        let realFileData = null
        
        if (fileType === 'document' && documentType) {
          try {
            const { data: documentData } = await supabase
              .from('driver_documents')
              .select('file_name, file_size, file_url')
              .eq('driver_id', driverId)
              .eq('document_type', documentType)
              .single()
            
            if (documentData) {
              realFileData = {
                url: documentData.file_url,
                name: documentData.file_name,
                size: documentData.file_size,
                type: documentData.file_name.endsWith('.pdf') ? 'application/pdf' : 'image',
                uploadedAt: new Date()
              }
            }
          } catch (error) {
            console.warn('⚠️ Impossible de récupérer les infos du document:', error)
          }
        }
        
        // Fallback sur currentFile si pas de données en base
        const fileData = realFileData || {
          url: currentFile.url,
          name: currentFile.name || extractFileNameFromUrl(currentFile.url) || 'Document',
          size: currentFile.size || 0,
          type: currentFile.url.includes('.pdf') ? 'application/pdf' : 'image',
          uploadedAt: new Date()
        }
        
        setUploadedFile(fileData)
        
        // Générer l'URL d'affichage appropriée
        updateViewableUrl(fileData)
      }
    }
    
    loadCurrentFileData()
  }, [currentFile, driverId, documentType, fileType])

  // Fonction helper pour extraire le nom de fichier depuis l'URL
  const extractFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split('/')
      const fileName = parts[parts.length - 1]
      // Enlever les paramètres de query s'il y en a
      return fileName.split('?')[0]
    } catch (error) {
      return null
    }
  }

  // Fonction pour mettre à jour l'URL d'affichage
  const updateViewableUrl = useCallback(async (file: UploadedFile) => {
    const bucketName = getBucketName()
    
    if (bucketName === 'driver-documents') {
      // Pour les documents privés, essayer de générer une URL signée
      try {
        const fileName = file.url.split('/').pop()
        if (fileName) {
          const signedUrl = await getSignedUrl(bucketName, `${driverId}/${fileName}`)
          setViewableUrl(signedUrl || file.url)
        } else {
          setViewableUrl(file.url)
        }
      } catch (error) {
        console.warn('⚠️ Impossible de générer l\'URL signée, utilisation de l\'URL publique:', error)
        setViewableUrl(file.url)
      }
    } else {
      // Pour les buckets publics, utiliser l'URL directement
      setViewableUrl(file.url)
    }
  }, [driverId, fileType])

  // Générer l'URL viewable (signée si nécessaire) quand le fichier change
  useEffect(() => {
    const generateViewableUrl = async () => {
      if (uploadedFile) {
        const bucketName = getBucketName()
        // Extraire le chemin du fichier depuis l'URL
        const urlParts = uploadedFile.url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `${driverId}/${fileName}`
        
        // Générer l'URL appropriée selon le type de bucket
        let url: string
        if (bucketName === 'driver-documents') {
          // Pour les documents privés, essayer de générer une URL signée
          try {
            const signedUrl = await getSignedUrl(bucketName, filePath)
            url = signedUrl || uploadedFile.url
          } catch (error) {
            console.warn('⚠️ Impossible de générer l\'URL signée:', error)
            url = uploadedFile.url
          }
        } else {
          // Pour les buckets publics, utiliser l'URL directement
          url = uploadedFile.url
        }
        
        setViewableUrl(url)
      }
    }
    
    generateViewableUrl()
  }, [uploadedFile, driverId])

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
    const extension = originalName.split('.').pop()
    const prefix = documentType || fileType
    // Utiliser un nom fixe pour permettre le remplacement automatique
    return `${driverId}/${prefix}.${extension}`
  }

  // Fonction pour supprimer l'ancien fichier avant d'uploader le nouveau
  const deleteOldFile = useCallback(async (bucketName: string, driverId: string, documentType?: string) => {
    try {
      // Lister les fichiers existants pour ce driver et ce type de document
      const { data: existingFiles } = await supabase.storage
        .from(bucketName)
        .list(driverId)
      
      if (existingFiles && existingFiles.length > 0) {
        const prefix = documentType || fileType
        const filesToDelete = existingFiles
          .filter(file => file.name.startsWith(prefix))
          .map(file => `${driverId}/${file.name}`)
        
        if (filesToDelete.length > 0) {
          console.log('🗑️ Suppression des anciens fichiers:', filesToDelete)
          await supabase.storage
            .from(bucketName)
            .remove(filesToDelete)
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la suppression des anciens fichiers:', error)
      // Ne pas bloquer l'upload pour autant
    }
  }, [fileType])

  const deleteFile = useCallback(async () => {
    if (!uploadedFile) return
    
    try {
      // Extraire le nom du fichier depuis l'URL
      const fileName = uploadedFile.url.split('/').pop()
      if (!fileName) throw new Error('Nom de fichier invalide')
      
      const bucketName = getBucketName()
      
      // Supprimer de Supabase Storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([`${driverId}/${fileName}`])
      
      if (error) throw error
      
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

      // 🗑️ Supprimer l'ancien fichier s'il existe (pour remplacer)
      await deleteOldFile(bucketName, driverId, documentType)

      // Upload vers Supabase Storage avec upsert: true pour remplacer
      console.log(`📤 Upload vers bucket: ${bucketName}/${fileName}`)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Permet de remplacer le fichier existant
        })

      clearInterval(progressInterval)

      if (error) {
        console.error('❌ Erreur upload Storage:', error)
        throw new Error(`Erreur Storage: ${error.message}`)
      }

      // Obtenir l'URL publique avec notre fonction helper
      const publicUrl = getStorageUrl(bucketName, fileName)
      console.log(`✅ Fichier uploadé: ${publicUrl}`)

      setProgress(100)

      // Enregistrer les informations du fichier uploadé
      const newFileData = {
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      }
      setUploadedFile(newFileData)

      // Générer l'URL d'affichage appropriée
      await updateViewableUrl(newFileData)

      // Mise à jour de la base de données selon le type
      if (fileType === 'avatar') {
        await supabase
          .from('drivers')
          .update({ avatar_url: publicUrl })
          .eq('id', driverId)
      } else if (fileType === 'document') {
        // Supprimer l'ancien enregistrement s'il existe
        await supabase
          .from('driver_documents')
          .delete()
          .eq('driver_id', driverId)
          .eq('document_type', documentType)

        // Insérer le nouveau enregistrement
        const { error: insertError } = await supabase
          .from('driver_documents')
          .insert({
            driver_id: driverId,
            document_type: documentType,
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size
          })

        if (insertError) {
          console.error('❌ Erreur insertion driver_documents:', insertError)
        }

        // Mettre à jour document_urls dans drivers
        const { data: driver } = await supabase
          .from('drivers')
          .select('document_urls')
          .eq('id', driverId)
          .single()

        const updatedUrls = {
          ...(driver?.document_urls as any || {}),
          [documentType!]: publicUrl
        }

        await supabase
          .from('drivers')
          .update({ document_urls: updatedUrls })
          .eq('id', driverId)

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
                        src={viewableUrl || uploadedFile.url} 
                        alt={uploadedFile.name}
                        className="w-full h-full object-cover"
                        onError={() => {
                          // Si l'image ne charge pas, utiliser l'URL de base
                          console.warn('⚠️ Erreur chargement image, utilisation URL de base')
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
            
            {/* Actions - Layout adaptatif mobile/desktop */}
            <div className="border-t border-neutral-700 pt-4">
              {/* Desktop: Layout 2 colonnes avec 2 boutons par ligne */}
              <div className="hidden lg:grid lg:grid-cols-2 gap-3">
                {/* Première ligne */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="font-medium">Aperçu</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(viewableUrl || uploadedFile.url, '_blank')}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="font-medium">Télécharger</span>
                </Button>
                
                {/* Deuxième ligne */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFileDialog}
                  className="border-blue-600 text-blue-300 hover:bg-blue-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span className="font-medium">Remplacer</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteFile}
                  className="border-red-600 text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="font-medium">Supprimer</span>
                </Button>
              </div>
              
              {/* Mobile et Tablet: Layout vertical */}
              <div className="lg:hidden space-y-3">
                {/* Actions principales */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    <span className="font-medium">Aperçu</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(viewableUrl || uploadedFile.url, '_blank')}
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    <span className="font-medium">Télécharger</span>
                  </Button>
                </div>
                
                {/* Actions secondaires */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFileDialog}
                    className="border-blue-600 text-blue-300 hover:bg-blue-900/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    <span className="font-medium">Remplacer</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteFile}
                    className="border-red-600 text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
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

        {/* Modal d'aperçu - Mobile optimisé */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-left break-words">
                <FileIcon className="w-5 h-5 shrink-0" />
                <span className="truncate">{uploadedFile.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              {isImage ? (
                <div className="flex justify-center">
                  <img 
                    src={viewableUrl || uploadedFile.url} 
                    alt={uploadedFile.name}
                    className="max-w-full h-auto rounded-lg border shadow-lg"
                    style={{ maxHeight: '70vh' }}
                    onError={() => {
                      toast({
                        variant: "destructive",
                        title: "❌ Impossible d'afficher l'image",
                        description: "Vérifiez les permissions du fichier"
                      })
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">{uploadedFile.name}</p>
                    <p className="text-sm text-neutral-500">
                      {formatFileSize(uploadedFile.size)} • PDF Document
                    </p>
                  </div>
                  <Button 
                    onClick={() => window.open(viewableUrl || uploadedFile.url, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    disabled={!viewableUrl && !uploadedFile.url}
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
  const currentFile = currentUrl ? {
    url: currentUrl,
    name: `${label}.pdf`,
    size: 0
  } : undefined

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-neutral-300">{label}</label>
      
      <FileUpload
        driverId={driverId}
        fileType="document"
        documentType={documentType}
        onUploadComplete={onUploadComplete}
        acceptedTypes=".pdf,image/*"
        maxSize={10}
        currentFile={currentFile}
      />
    </div>
  )
}
