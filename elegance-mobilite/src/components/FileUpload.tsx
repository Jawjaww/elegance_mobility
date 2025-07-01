import { useState, useCallback } from 'react'
import { supabase } from '@/lib/database/client'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  CheckCircle, 
  AlertCircle,
  Camera
} from 'lucide-react'

interface FileUploadProps {
  driverId: string
  fileType: 'avatar' | 'document' | 'vehicle_photo'
  documentType?: string
  onUploadComplete: (url: string) => void
  acceptedTypes?: string
  maxSize?: number // en MB
  children?: React.ReactNode
}

export function FileUpload({ 
  driverId, 
  fileType, 
  documentType,
  onUploadComplete,
  acceptedTypes = "image/*,.pdf",
  maxSize = 10,
  children 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const { toast } = useToast()

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
    return `${driverId}/${prefix}_${timestamp}.${extension}`
  }

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

      // Mise à jour de la base de données selon le type
      if (fileType === 'avatar') {
        await supabase
          .from('drivers')
          .update({ avatar_url: publicUrl })
          .eq('id', driverId)
      } else if (fileType === 'document') {
        // Enregistrer dans driver_documents
        await supabase
          .from('driver_documents')
          .insert({
            driver_id: driverId,
            document_type: documentType,
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size
          })

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
      }

      onUploadComplete(publicUrl)

      toast({
        title: "✅ Fichier uploadé",
        description: "Le fichier a été enregistré avec succès"
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
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [uploadFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }, [uploadFile])

  if (children) {
    return (
      <div className="relative">
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={uploading}
        />
        {children}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <Upload className="w-6 h-6 animate-pulse mx-auto mb-2" />
              <p className="text-sm">{progress}%</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
      <CardContent className="p-6">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="text-center space-y-4"
        >
          {/* Icon */}
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            {fileType === 'avatar' ? (
              <Camera className="w-6 h-6 text-blue-600" />
            ) : (
              <FileText className="w-6 h-6 text-blue-600" />
            )}
          </div>

          {/* Upload State */}
          {uploading ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Upload className="w-5 h-5 animate-pulse text-blue-600" />
                <span className="text-sm font-medium">Upload en cours...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">{progress}%</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {fileType === 'avatar' ? 'Photo de profil' : 'Document'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Glissez-déposez ou cliquez pour sélectionner
                </p>
              </div>

              <input
                type="file"
                accept={acceptedTypes}
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <Button variant="outline" size="sm" className="pointer-events-none">
                <Upload className="w-4 h-4 mr-2" />
                Choisir un fichier
              </Button>

              <p className="text-xs text-gray-400">
                {acceptedTypes.includes('image') ? 'JPG, PNG' : 'PDF'} - Max {maxSize}MB
              </p>
            </>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-4">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded-lg mx-auto border-2 border-green-200"
              />
              <p className="text-xs text-green-600 mt-2 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Prêt à sauvegarder
              </p>
            </div>
          )}
        </div>
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
  return (
    <FileUpload
      driverId={driverId}
      fileType="avatar"
      onUploadComplete={onUploadComplete}
      acceptedTypes="image/*"
      maxSize={5}
    >
      <div className="relative group cursor-pointer">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
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
          <Camera className="w-6 h-6 text-white" />
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
  const hasDocument = !!currentUrl

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      {hasDocument ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">Document uploadé</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(currentUrl, '_blank')}
            >
              Voir
            </Button>
            <FileUpload
              driverId={driverId}
              fileType="document"
              documentType={documentType}
              onUploadComplete={onUploadComplete}
              acceptedTypes=".pdf,image/*"
              maxSize={10}
            >
              <Button variant="outline" size="sm">
                Remplacer
              </Button>
            </FileUpload>
          </div>
        </div>
      ) : (
        <FileUpload
          driverId={driverId}
          fileType="document"
          documentType={documentType}
          onUploadComplete={onUploadComplete}
          acceptedTypes=".pdf,image/*"
          maxSize={10}
        />
      )}
    </div>
  )
}
