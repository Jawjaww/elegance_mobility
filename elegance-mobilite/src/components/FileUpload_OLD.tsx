import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { extractFilePathFromUrl } from '@/lib/supabase-storage-setup'
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
  userId?: string  // Ajouter userId pour les politiques RLS
  fileType: 'avatar' | 'document' | 'vehicle_photo'
  documentType?: string
  onUploadComplete: (url: string) => void
  onFileDeleted?: () => void // Nouveau callback pour la suppression
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

// Fonction utilitaire pour formater la taille des fichiers
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function FileUpload({ 
  driverId, 
  userId,
  fileType, 
  documentType,
  onUploadComplete,
  onFileDeleted,
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

  // Fonctions utilitaires
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
    const pathId = userId || driverId
    const extension = originalName.split('.').pop()
    const timestamp = Date.now()
    
    // Format: driverId_documentType_timestamp.extension
    return `driver-documents/${pathId}_${documentType}_${timestamp}.${extension}`
  }

  // Fonction utilitaire pour détecter le type MIME depuis l'URL ou le nom de fichier
  const detectFileType = (fileUrl: string, fileName?: string): string => {
    const url = fileUrl.toLowerCase()
    const name = fileName?.toLowerCase() || ''
    
    // Détecter le type par extension
    if (url.includes('.pdf') || name.includes('.pdf')) return 'application/pdf'
    if (url.includes('.png') || name.includes('.png')) return 'image/png'
    if (url.includes('.jpg') || url.includes('.jpeg') || name.includes('.jpg') || name.includes('.jpeg')) return 'image/jpeg'
    if (url.includes('.gif') || name.includes('.gif')) return 'image/gif'
    if (url.includes('.webp') || name.includes('.webp')) return 'image/webp'
    if (url.includes('.svg') || name.includes('.svg')) return 'image/svg+xml'
    
    // Par défaut, si on ne peut pas détecter
    return 'application/octet-stream'
  }

  // Récupérer le document existant depuis la table driver_documents (structure correcte)
  const fetchExistingDocument = useCallback(async () => {
    if (fileType === 'document' && documentType) {
      try {
        // Récupérer depuis driver_documents (la vraie structure Supabase)
        const { data: document, error } = await supabase
          .from('driver_documents')
          .select('file_url, file_name, file_size, created_at')
          .eq('driver_id', driverId)
          .eq('document_type', documentType)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = pas de résultat
          console.error('Erreur récupération document:', error)
          return
        }

        if (document) {
          console.log('✅ Document trouvé dans driver_documents:', document)
          
          const detectedType = detectFileType(document.file_url, document.file_name)
          
          setUploadedFile({
            url: document.file_url,
            name: document.file_name || `${documentType}`,
            size: document.file_size || 0,
            type: detectedType,
            uploadedAt: new Date(document.created_at)
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
      const detectedType = detectFileType(currentFile.url, currentFile.name)
      
      setUploadedFile({
        url: currentFile.url,
        name: currentFile.name || 'Document',
        size: currentFile.size || 0,
        type: detectedType,
        uploadedAt: new Date()
      })
    } else {
      // Si pas de currentFile, essayer de récupérer depuis la DB
      fetchExistingDocument()
    }
  }, [currentFile, fetchExistingDocument])

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
      } else if ((fileType === 'document' || fileType === 'vehicle_photo') && documentType) {
        // Supprimer de la table driver_documents (structure correcte)
        const { error: deleteError } = await supabase
          .from('driver_documents')
          .delete()
          .eq('driver_id', driverId)
          .eq('document_type', documentType)

        if (deleteError) {
          console.error('❌ Erreur suppression base de données:', deleteError)
          throw deleteError
        }
      }
      
      setUploadedFile(null)
      onUploadComplete('')
      
      // Appeler le callback de suppression si fourni
      onFileDeleted?.()
      
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
  }, [uploadedFile, driverId, fileType, documentType, onUploadComplete, toast, getBucketName])

  const uploadFile = useCallback(async (file: File) => {
    console.log('🚀 Début upload fichier:', file.name, 'Type:', fileType, 'DocumentType:', documentType)
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
      
      console.log('📂 Upload vers bucket:', bucketName, 'Fichier:', fileName)

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
          upsert: true,
          contentType: file.type // Spécifier le type MIME
        })

      clearInterval(progressInterval)

      if (error) throw error

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      setProgress(100)

      // Enregistrer dans la table driver_documents (structure correcte)
      if (fileType === 'document' && documentType) {
        // 🔍 DEBUG RLS: Récupérer l'utilisateur connecté
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('❌ ERREUR AUTH:', authError)
          toast({
            title: "Erreur d'authentification",
            description: "Impossible de vérifier votre identité",
            variant: "destructive"
          })
          setUploading(false)
          setProgress(0)
          return
        }
        
        console.log('🔍 DEBUG RLS:', {
          userId: user.id,
          driverId: driverId,
          documentType: documentType
        })
        
        // Vérifier que ce driverId appartient bien à l'utilisateur connecté
        const { data: driverCheck, error: driverCheckError } = await supabase
          .from('drivers')
          .select('id, user_id')
          .eq('id', driverId)
          .eq('user_id', user.id)
          .single()
          
        console.log('🔍 Vérification driver:', { driverCheck, driverCheckError })
        
        if (driverCheckError || !driverCheck) {
          console.error('❌ ERREUR RLS: driverId ne correspond pas à user_id!')
          console.error('Details:', { 
            driverId, 
            userId: user.id, 
            error: driverCheckError 
          })
          toast({
            title: "Erreur de sécurité",
            description: "Vous n'êtes pas autorisé à modifier ce profil",
            variant: "destructive"
          })
          setUploading(false)
          setProgress(0)
          return
        }
        
        // D'abord supprimer l'ancien document s'il existe
        const { error: deleteError } = await supabase
          .from('driver_documents')
          .delete()
          .eq('driver_id', driverId)
          .eq('document_type', documentType)

        if (deleteError) {
          console.warn('⚠️ Erreur suppression ancien document:', deleteError)
        }

        // Insérer le nouveau document avec métadonnées complètes
        const { data: insertData, error: dbError } = await supabase
          .from('driver_documents')
          .insert({
            driver_id: driverId,
            document_type: documentType,
            file_url: publicUrl,
            file_name: file.name, // Nom de fichier original
            file_size: file.size, // Taille réelle du fichier
            validation_status: 'pending'
          })
          .select()

        if (dbError) {
          console.error('❌ Erreur insertion base de données:', dbError)
          throw dbError
        }

        console.log('✅ Document enregistré en base:', insertData)
      } else if (fileType === 'vehicle_photo' && documentType) {
        // Gérer les photos de véhicules
        const { error: deleteError } = await supabase
          .from('driver_documents')
          .delete()
          .eq('driver_id', driverId)
          .eq('document_type', documentType)

        if (deleteError) {
          console.warn('⚠️ Erreur suppression ancienne photo:', deleteError)
        }

        // Insérer la nouvelle photo
        const { data: insertData, error: dbError } = await supabase
          .from('driver_documents')
          .insert({
            driver_id: driverId,
            document_type: documentType,
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
            validation_status: 'pending'
          })
          .select()

        if (dbError) {
          console.error('❌ Erreur insertion photo véhicule:', dbError)
          throw dbError
        }

        console.log('✅ Photo véhicule enregistrée:', insertData)
      } else if (fileType === 'avatar') {
        // Mise à jour avatar dans drivers
        await supabase
          .from('drivers')
          .update({ avatar_url: publicUrl })
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
  }, [driverId, fileType, documentType, maxSize, onUploadComplete, toast, generateFileName, getBucketName])

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
    console.log('📁 Fichier sélectionné via input')
    const files = e.target.files
    if (files && files.length > 0) {
      console.log('📄 Fichier à uploader:', files[0].name)
      uploadFile(files[0])
    }
    // Reset input pour permettre de sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadFile])

  const openFileDialog = useCallback(() => {
    console.log('🔍 Ouverture du sélecteur de fichiers')
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
                    <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-green-200 bg-green-50">
                      <img 
                        src={uploadedFile.url} 
                        alt={uploadedFile.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Erreur chargement image:', uploadedFile.url)
                          // Fallback vers l'icône si l'image ne charge pas
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="w-full h-full bg-green-100 rounded-lg flex items-center justify-center">
                              <svg class="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                              </svg>
                            </div>
                          `
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
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
            
            {/* Actions */}
            <div className="border-t border-neutral-700 pt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFileDialog}
                  className="border-blue-600 text-blue-300 hover:bg-blue-900/20 flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Remplacer
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteFile}
                  className="border-red-600 text-red-300 hover:bg-red-900/20 flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
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

        {/* Modal d'aperçu - Thème sombre et mobile optimisé */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] bg-neutral-900 border-neutral-700 text-neutral-100 overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-left break-words text-neutral-100">
                <FileIcon className="w-5 h-5 shrink-0 text-neutral-400" />
                <span className="truncate">{uploadedFile.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4 space-y-6">
              {isImage ? (
                <div className="space-y-4">
                  {/* Miniature optimisée pour mobile */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <img 
                        src={uploadedFile.url} 
                        alt={uploadedFile.name}
                        className="max-w-full max-h-64 sm:max-h-80 object-contain rounded-lg border border-neutral-600 bg-neutral-800"
                      />
                    </div>
                  </div>
                  
                  {/* Informations du fichier */}
                  <div className="text-center space-y-2 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <p className="text-sm text-neutral-300">
                      {formatFileSize(uploadedFile.size)} • Image
                    </p>
                    <p className="text-xs text-neutral-400">
                      Uploadé le {uploadedFile.uploadedAt.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Miniature PDF - Thème sombre */}
                  <div className="flex flex-col items-center py-8 space-y-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <div className="relative">
                      <div className="w-20 h-26 bg-neutral-700 rounded-lg border-2 border-neutral-600 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-neutral-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        PDF
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h3 className="text-base font-semibold text-neutral-200 max-w-xs truncate">
                        {uploadedFile.name}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {formatFileSize(uploadedFile.size)} • Document PDF
                      </p>
                      <p className="text-xs text-neutral-500">
                        Uploadé le {uploadedFile.uploadedAt.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions - Thème sombre uniforme */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-700">
                <Button 
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = uploadedFile.url
                    link.download = uploadedFile.name
                    link.click()
                  }}
                  variant="outline"
                  className="border-green-600 text-green-300 hover:bg-green-900/20 flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                
                <Button 
                  onClick={() => window.open(uploadedFile.url, '_blank')}
                  variant="outline"
                  className="border-blue-600 text-blue-300 hover:bg-blue-900/20 flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
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
  userId,
  documentType, 
  label,
  currentUrl,
  onUploadComplete 
}: {
  driverId: string
  userId?: string
  documentType: string
  label: string
  currentUrl?: string | null
  onUploadComplete: (url: string) => void
}) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      
      <FileUpload
        driverId={driverId}
        userId={userId}
        fileType="document"
        documentType={documentType}
        onUploadComplete={onUploadComplete}
        acceptedTypes=".pdf,image/*"
        maxSize={10}
      />
    </div>
  )
}