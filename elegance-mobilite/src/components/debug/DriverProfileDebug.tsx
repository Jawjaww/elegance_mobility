/**
 * Composant de debug pour créer manuellement le profil driver
 * À afficher temporairement pour résoudre l'erreur 406
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { createMissingDriverProfile, checkDriverProfile } from '@/lib/utils/createDriverProfile'

interface DriverProfileDebugProps {
  userId: string
}

export function DriverProfileDebug({ userId }: DriverProfileDebugProps) {
  const [status, setStatus] = React.useState<string>('idle')
  const [profileExists, setProfileExists] = React.useState<boolean | null>(null)

  const checkProfile = async () => {
    setStatus('checking...')
    const result = await checkDriverProfile(userId)
    setProfileExists(result.exists)
    setStatus(result.exists ? 'Profile exists' : 'Profile missing')
  }

  const createProfile = async () => {
    setStatus('creating...')
    const result = await createMissingDriverProfile()
    if (result.success) {
      setStatus('Profile created! Reloading...')
      setTimeout(() => window.location.reload(), 1500)
    } else {
      setStatus(`Error: ${JSON.stringify(result.error)}`)
    }
  }

  React.useEffect(() => {
    checkProfile()
  }, [userId])

  return (
    <div className="fixed top-4 left-4 z-50 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="font-bold mb-2">🔧 Driver Profile Debug</h3>
      <p className="text-sm mb-2">User ID: {userId}</p>
      <p className="text-sm mb-4">Status: {status}</p>
      
      <div className="space-y-2">
        <Button 
          onClick={checkProfile}
          variant="outline"
          size="sm"
          className="w-full text-black"
        >
          Check Profile
        </Button>
        
        {profileExists === false && (
          <Button 
            onClick={createProfile}
            variant="default"
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Create Profile
          </Button>
        )}
      </div>
    </div>
  )
}
