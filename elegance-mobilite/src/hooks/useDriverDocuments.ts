import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import type { Database } from '@/lib/types/database.types'

type DriverDocument = Database['public']['Tables']['driver_documents']['Row']

interface DriverDocuments {
  [documentType: string]: {
    url: string
    file_name: string
    file_size: number
    upload_date: string
    validation_status: string
  }
}

export function useDriverDocuments(driverId: string) {
  const [documents, setDocuments] = useState<DriverDocuments>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!driverId) {
      setLoading(false)
      return
    }

    const fetchDocuments = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: docs, error: fetchError } = await supabase
          .from('driver_documents')
          .select('*')
          .eq('driver_id', driverId)

        if (fetchError) {
          throw fetchError
        }

        // Transformer en objet indexé par document_type
        const documentsMap: DriverDocuments = {}
        
        for (const doc of docs || []) {
          // Pour les documents privés, générer une URL signée
          let displayUrl = doc.file_url
          
          if (doc.file_url.includes('driver-documents')) {
            try {
              const signedUrl = await getSignedUrlFromPublicUrl(doc.file_url, 'driver-documents', 3600)
              if (signedUrl) {
                displayUrl = signedUrl
              }
            } catch (urlError) {
              console.warn('Erreur génération URL signée:', urlError)
              // Garder l'URL originale en cas d'erreur
            }
          }

          documentsMap[doc.document_type] = {
            url: displayUrl,
            file_name: doc.file_name || '',
            file_size: doc.file_size || 0,
            upload_date: doc.upload_date || doc.created_at || '',
            validation_status: doc.validation_status || 'pending'
          }
        }

        setDocuments(documentsMap)
      } catch (err: any) {
        console.error('Erreur lors de la récupération des documents:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [driverId])

  // Fonction pour rafraîchir les documents
  const refreshDocuments = async () => {
    if (!driverId) return
    
    setLoading(true)
    // Re-déclencher le useEffect
    const event = new CustomEvent('refreshDocuments', { detail: { driverId } })
    window.dispatchEvent(event)
  }

  return {
    documents,
    loading,
    error,
    refreshDocuments
  }
}

// Hook pour récupérer un document spécifique
export function useDriverDocument(driverId: string, documentType: string) {
  const { documents, loading, error, refreshDocuments } = useDriverDocuments(driverId)
  
  return {
    document: documents[documentType] || null,
    loading,
    error,
    refreshDocuments
  }
}
