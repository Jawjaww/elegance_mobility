// NOTIFICATION PROFIL INCOMPLET - STRATÉGIE FINALE 2025
// ✅ IMPLÉMENTATION UNIFIÉE ET SIMPLIFIÉE

// 🎯 STRATÉGIE ADOPTÉE:
// - UNE SEULE notification via ProfileAlert dans le BottomSheet
// - PAS d'affichage si profil complet (UX propre)
// - Gestion via hook useDriverProfileCompleteness unifié
// - Modal ProfileCompletionModal pour la completion

// 🎯 RÈGLES DE LA STRATÉGIE FINALE

// ✅ AFFICHAGE
// - ProfileAlert s'affiche UNIQUEMENT si profil incomplet
// - PAS d'affichage pendant le chargement (évite flash)  
// - PAS d'affichage si profil complet (UX propre)

// ✅ LOGIQUE TOAST EN LIGNE/HORS LIGNE
const toggleOnlineStatus = () => {
  if (!isProfileComplete && !isOnline) {
    toast({
      variant: "destructive", 
      title: "Profil incomplet",
      description: "Vous devez compléter votre profil à 100% pour passer en ligne"
    })
    setShowProfileModal(true)
    return
  }
  
  setIsOnline(!isOnline)
  const newOnlineState = !isOnline
  
  toast({
    variant: newOnlineState ? "success" : "destructive",
    title: newOnlineState ? "En ligne" : "Hors ligne", 
    description: newOnlineState 
      ? "Vous êtes maintenant disponible pour recevoir des courses" 
      : "Vous ne recevrez plus de nouvelles courses"
  })
}

// ✅ PROTECTION DES ACTIONS
// - Accepter course : nécessite profil complet
// - Passer en ligne : nécessite profil complet  
// - Actions de course : nécessite profil complet

// 🚀 AVANTAGES DE CETTE STRATÉGIE
// ✅ Une seule source de vérité (ProfileAlert)
// ✅ Interface propre (pas de notification si OK)
// ✅ Données temps réel via SQL RPC
// ✅ Pas de redondance dans l'UI
// ✅ Experience utilisateur cohérente
// ✅ Modal centralisée pour completion
// ✅ Protection robuste des actions

// 📂 FICHIERS IMPACTÉS
// - /src/hooks/useDriverProfileCompleteness.ts (hook unifié)
// - /src/components/drivers/ProfileAlert.tsx (notification principale)
// - /src/components/drivers/ProfileCompletionModal.tsx (modal)
// - /src/app/driver-portal/page.tsx (intégration dashboard)
// - /docs/verification-profil-complet.sql (fonction SQL)

// � Hook final pour vérifier la complétude du profil
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/database/client'

export interface ProfileCompletenessResult {
  is_complete: boolean
  completion_percentage: number
  missing_fields: string[]
}

export function useDriverProfileCompleteness(userId: string) {
  return useQuery({
    queryKey: ['driver-profile-completeness', userId],
    queryFn: async (): Promise<ProfileCompletenessResult> => {
      const { data, error } = await supabase
  // Voir la section "Vérification de Complétude : check_driver_profile_completeness" dans ARCHITECTURE-COMPLETE-SYSTEM-2025.md pour la logique détaillée
  .rpc('check_driver_profile_completeness', { driver_user_id: userId })
        .single()

      if (error) {
        console.error('Erreur lors de la vérification du profil:', error)
        throw error
      }

      return data as ProfileCompletenessResult
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 secondes
    refetchOnWindowFocus: true,
  })
}

// 🎯 COMPOSANT PRINCIPAL : ProfileAlert (SOURCE UNIQUE DE VÉRITÉ)
import { AlertTriangle, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useDriverProfileCompleteness } from "@/hooks/useDriverProfileCompleteness"

interface ProfileAlertProps {
  userId: string
  onCompleteProfile: () => void
}

export function ProfileAlert({ 
  userId,
  onCompleteProfile 
}: ProfileAlertProps) {
  const { data: completeness, isLoading } = useDriverProfileCompleteness(userId)
  
  // ✅ RÈGLE : Ne rien afficher pendant le chargement ou si profil complet
  if (isLoading || !completeness || completeness.is_complete) {
    return null
  }

  const missingFieldsLabels: Record<string, string> = {
    first_name: 'Prénom',
    phone: 'Téléphone', 
    company_name: 'Entreprise',
    company_phone: 'Tél. entreprise',
    driving_license_number: 'Permis',
    driving_license_expiry_date: 'Expiration permis',
    vtc_card_number: 'Carte VTC',
    vtc_card_expiry_date: 'Expiration VTC'
  }

  const missingLabels = completeness.missing_fields
    .map(field => missingFieldsLabels[field] || field)
    .slice(0, 3) // Limiter à 3 pour l'affichage
    .join(', ')

  return (
    <Card className="border-amber-800 bg-amber-900/20">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        <div className="flex-1">
          <p className="font-medium text-amber-200">
            Profil incomplet ({completeness.completion_percentage}%)
          </p>
          <p className="text-sm text-amber-300">
            Complétez votre profil pour accepter des courses
          </p>
          {completeness.missing_fields.length > 0 && (
            <p className="text-xs text-amber-400 mt-1">
              Manque: {missingLabels}{completeness.missing_fields.length > 3 ? '...' : ''}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-amber-900/30 border-amber-600 text-amber-200 hover:bg-amber-900/50"
          onClick={onCompleteProfile}
        >
          <User className="h-4 w-4 mr-2" />
          Compléter
        </Button>
      </CardContent>
    </Card>
  )
}

// �️ PROTECTION DES COURSES : ProfileCheckWrapper
// Utilisé pour bloquer l'accès aux courses si profil incomplet
const ProfileCheckWrapper = ({ userId, children }: { userId: string, children: React.ReactNode }) => {
  const { data: completeness, isLoading } = useDriverProfileCompleteness(userId)
  
  if (isLoading) {
    return <div className="text-center py-4 text-white">Vérification du profil...</div>
  }
  
  if (!completeness?.is_complete) {
    return (
      <div className="p-4">
        <ProfileAlert 
          userId={userId}
          onCompleteProfile={() => {
            // Ouvrir modal de completion
            setShowProfileModal(true)
          }}
        />
      </div>
    )
  }
  
  return <>{children}</>
}

// � UTILISATION DANS LE DASHBOARD DRIVER (page.tsx)

// ✅ IMPORTS NÉCESSAIRES
import { ProfileAlert } from "@/components/drivers/ProfileAlert"
import { ProfileCompletionModal } from "@/components/drivers/ProfileCompletionModal"
import { useDriverProfileCompleteness } from "@/hooks/useDriverProfileCompleteness"

// ✅ INTÉGRATION DANS LE BOTTOMSHEET
export default function DriverDashboard() {
  const [user, setUser] = useState<any>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Carte principale */}
      <DriverMap />

      {/* BottomSheet avec notification unifiée */}
      <BottomSheet
        minHeight={120}
        maxHeight={viewportHeight * 0.85}
        defaultHeight={200}
      >
        {/* 🎯 UNE SEULE NOTIFICATION GLOBALE */}
        {!isLoadingAuth && user && (
          <>
            <div className="p-4">
              <ProfileAlert 
                userId={user.id}
                onCompleteProfile={() => setShowProfileModal(true)}
              />
            </div>
            
            <ProfileCompletionModal
              userId={user.id}
              isOpen={showProfileModal}
              onClose={() => setShowProfileModal(false)}
            />
          </>
        )}
        
        {/* Bouton en ligne/hors ligne */}
        <div className="flex items-center justify-center mb-2 px-2">
          <Button
            onClick={toggleOnlineStatus}
            disabled={!isProfileComplete && !isOnline}
            className={cn(
              isOnline 
                ? "bg-green-500/20 border-green-500/50" 
                : "bg-red-500/20 border-red-500/50"
            )}
          >
            {isOnline ? "En ligne" : "Hors ligne"}
          </Button>
        </div>

        {/* Tabs avec protection */}
        <SwipeableTabs tabs={tabsContent} />
      </BottomSheet>
    </div>
  )
}
