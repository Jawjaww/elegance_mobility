'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/database/client'
import ModernDriverProfileSetup from '@/components/drivers/ModernDriverProfileSetup'

export default function DriverProfileSetupPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/driver-portal/login')
          return
        }
        setUser(user)
      } catch (error) {
        console.error('Erreur auth:', error)
        router.push('/driver-portal/login')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-neutral-300">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Redirection en cours
  }
  
  return <ModernDriverProfileSetup userId={user.id} />
}
