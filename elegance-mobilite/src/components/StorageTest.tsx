"use client"

import { useState } from 'react'
import { supabase } from '@/lib/database/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export function StorageTest() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const runTests = async () => {
    setTesting(true)
    setResults([])
    
    const testResults: any[] = []
    
    try {
      // Test 1: Vérifier la connexion Supabase
      testResults.push({ test: "Connexion Supabase", status: "info", message: "Test en cours..." })
      setResults([...testResults])
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        testResults[0] = { test: "Connexion Supabase", status: "error", message: `Erreur auth: ${authError.message}` }
      } else {
        testResults[0] = { test: "Connexion Supabase", status: "success", message: `Connecté: ${user?.email || 'Anonyme'}` }
      }
      setResults([...testResults])

      // Test 2: Vérifier les buckets
      testResults.push({ test: "Buckets Storage", status: "info", message: "Vérification..." })
      setResults([...testResults])
      
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      if (bucketsError) {
        testResults[1] = { test: "Buckets Storage", status: "error", message: `Erreur: ${bucketsError.message}` }
      } else {
        const requiredBuckets = ['driver-avatars', 'driver-documents', 'vehicle-photos']
        const existingBuckets = buckets?.map(b => b.id) || []
        const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b))
        
        if (missingBuckets.length > 0) {
          testResults[1] = { test: "Buckets Storage", status: "warning", message: `Manquants: ${missingBuckets.join(', ')}` }
        } else {
          testResults[1] = { test: "Buckets Storage", status: "success", message: "Tous les buckets présents" }
        }
      }
      setResults([...testResults])

      // Test 3: Test upload simple
      testResults.push({ test: "Test Upload", status: "info", message: "Test d'upload..." })
      setResults([...testResults])
      
      // Créer un fichier de test
      const testFile = new File(['Test content'], 'test.txt', { type: 'text/plain' })
      const testPath = `test-${Date.now()}.txt`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(testPath, testFile)
        
      if (uploadError) {
        testResults[2] = { test: "Test Upload", status: "error", message: `Erreur upload: ${uploadError.message}` }
      } else {
        // Nettoyer le fichier de test
        await supabase.storage.from('driver-documents').remove([testPath])
        testResults[2] = { test: "Test Upload", status: "success", message: "Upload fonctionne" }
      }
      setResults([...testResults])

      // Test 4: Vérifier tables
      testResults.push({ test: "Tables Database", status: "info", message: "Vérification..." })
      setResults([...testResults])
      
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('id, document_urls, avatar_url')
        .limit(1)
        
      if (driversError) {
        testResults[3] = { test: "Tables Database", status: "error", message: `Erreur: ${driversError.message}` }
      } else {
        testResults[3] = { test: "Tables Database", status: "success", message: "Tables accessibles" }
      }
      setResults([...testResults])

    } catch (error: any) {
      testResults.push({ test: "Erreur générale", status: "error", message: error.message })
      setResults([...testResults])
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default: return <Upload className="w-5 h-5 text-blue-600 animate-pulse" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Test Storage Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-pulse" />
              Tests en cours...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Lancer les tests
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Résultats des tests :</h3>
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border flex items-center gap-3 ${getStatusColor(result.status)}`}
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{result.test}</p>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-500 space-y-1">
          <p><strong>Ce test vérifie :</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Connexion à Supabase</li>
            <li>Existence des buckets Storage</li>
            <li>Permissions d'upload</li>
            <li>Accès aux tables drivers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
