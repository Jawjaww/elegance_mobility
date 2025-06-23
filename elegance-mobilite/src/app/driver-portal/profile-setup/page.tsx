'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/database/client'

export default function DriverProfileSetupPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/driver-portal/login')
        return
      }
      setUser(user)
    }
    getUser()
  }, [router])
  
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Chargement...</p>
      </div>
    </div>
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Compléter votre profil chauffeur
            </h1>
            <p className="text-gray-600">
              Complétez les informations ci-dessous pour accéder aux courses
            </p>
          </div>
          
          {/* Le composant ModernDriverProfileSetup sera intégré ici */}
          <div className="bg-orange-50 p-8 rounded-lg text-center">
            <h2 className="text-xl font-semibold text-orange-800 mb-4">
              Formulaire de profil à intégrer
            </h2>
            <p className="text-orange-700 mb-6">
              Le composant ModernDriverProfileSetup sera rendu ici
            </p>
            <button
              onClick={() => router.push('/driver-portal')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
