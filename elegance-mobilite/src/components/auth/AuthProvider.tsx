'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/database/client'
import { getAppRole, type AppRole } from '@/lib/types/common.types'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  role: AppRole | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refreshSession: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const updateUserState = useCallback((sessionUser: User | null) => {
    if (sessionUser) {
      setUser(sessionUser)
      setRole(getAppRole(sessionUser) as AppRole)
    } else {
      setUser(null)
      setRole(null)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      updateUserState(session?.user ?? null)
    } catch (error) {
      console.error('Erreur refresh session:', error)
      updateUserState(null)
    }
  }, [updateUserState])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    updateUserState(null)
    window.location.href = '/auth/login'
  }, [updateUserState])

  useEffect(() => {
    // Initialisation
    refreshSession().then(() => setIsLoading(false))

    // Écoute des changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event)
        updateUserState(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [refreshSession, updateUserState])

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
