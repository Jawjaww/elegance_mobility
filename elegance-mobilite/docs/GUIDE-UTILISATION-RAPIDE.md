# 📋 GUIDE D'UTILISATION RAPIDE - SYSTÈME AUTOMATIQUE DE GESTION DES PROFILS

> **⚡ Guide pratique pour développeurs et administrateurs**  
> Basé sur la documentation complète `ARCHITECTURE-COMPLETE-SYSTEM-2025.md`

---

## 🚀 **ACTIONS COURANTES**

### **🔍 1. Vérifier la complétude d'un profil**

**En SQL :**
```sql
SELECT * FROM check_driver_profile_completeness('user-uuid-here');
```

**En TypeScript/React :**
```typescript
const { data } = await supabase
  .rpc('check_driver_profile_completeness', { 
    driver_user_id: userId 
  })
  .single()

console.log({
  isComplete: data.is_complete,
  percentage: data.completion_percentage,
  missing: data.missing_fields
})
```

### **🔄 2. Forcer la mise à jour d'un statut**

```sql
SELECT * FROM force_update_driver_status('user-uuid-here');
```

```typescript
const { data } = await supabase
  .rpc('force_update_driver_status', { driver_user_id: userId })
  .single()

console.log(`${data.old_status} → ${data.new_status}`)
```

### **🧹 3. Corriger tous les statuts en masse**

```sql
SELECT * FROM fix_all_driver_statuses();
```

### **📊 4. Obtenir des statistiques**

```sql
-- Statistiques globales
SELECT * FROM get_drivers_completeness_stats();

-- Profils incomplets détaillés
SELECT * FROM get_incomplete_drivers_report();
```

---

## 🛠️ **INTÉGRATION FRONTEND**

### **📄 Hook React Complet**

```typescript
// hooks/useDriverProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const useDriverProfile = (userId: string) => {
  const queryClient = useQueryClient()

  // Vérification de complétude
  const completeness = useQuery({
    queryKey: ['driver-completeness', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('check_driver_profile_completeness', { 
          driver_user_id: userId 
        })
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000 // 30 secondes
  })

  // Forcer la mise à jour du statut
  const updateStatus = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('force_update_driver_status', { 
          driver_user_id: userId 
        })
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Recharger les données
      queryClient.invalidateQueries(['driver-completeness', userId])
      queryClient.invalidateQueries(['driver-profile', userId])
    }
  })

  return {
    completeness: completeness.data,
    isLoading: completeness.isLoading,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending
  }
}
```

### **📱 Composant d'Alerte de Complétude**

```typescript
// components/DriverCompletenessAlert.tsx
import { useDriverProfile } from '@/hooks/useDriverProfile'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface Props {
  userId: string
}

export const DriverCompletenessAlert = ({ userId }: Props) => {
  const { completeness, isLoading } = useDriverProfile(userId)

  if (isLoading) return <div>Vérification du profil...</div>

  if (!completeness) return null

  if (completeness.is_complete) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Profil complet ✅</AlertTitle>
        <AlertDescription className="text-green-700">
          Votre profil est à 100% et en attente de validation
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        Profil incomplet ({completeness.completion_percentage}%)
      </AlertTitle>
      <AlertDescription className="text-orange-700">
        <p className="mb-2">Champs manquants :</p>
        <ul className="list-disc list-inside space-y-1">
          {completeness.missing_fields.map((field, index) => (
            <li key={index} className="text-sm">{field}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
```

### **📤 Callback après Upload de Document**

```typescript
// Dans votre composant d'upload
const handleDocumentUpload = async (file: File, documentType: string) => {
  try {
    // 1. Upload du fichier
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(`${userId}/${documentType}`, file)
    
    if (uploadError) throw uploadError

    // 2. Sauvegarder l'URL dans le profil
    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        document_urls: {
          ...existingUrls,
          [documentType]: uploadData.path
        }
      })
      .eq('user_id', userId)
    
    if (updateError) throw updateError

    // 3. ✨ AUTOMATIQUE : Le trigger va mettre à jour le statut
    // Mais on peut forcer pour une UX immédiate
    await updateStatus()

    toast({
      title: "✅ Document uploadé",
      description: "Statut du profil mis à jour automatiquement"
    })

  } catch (error) {
    toast({
      title: "❌ Erreur",
      description: error.message,
      variant: "destructive"
    })
  }
}
```

---

## ⚡ **COMMANDES UTILES POUR ADMINS**

### **🔧 Diagnostic et Maintenance**

```sql
-- 1. État général du système
SELECT * FROM get_drivers_completeness_stats();

-- 2. Top 10 profils incomplets
SELECT * FROM get_incomplete_drivers_report() 
ORDER BY completion_percentage ASC 
LIMIT 10;

-- 3. Vérifier un profil spécifique
SELECT * FROM check_driver_profile_completeness('user-uuid');

-- 4. Corriger tous les statuts
SELECT * FROM fix_all_driver_statuses();

-- 5. Vérifier les triggers actifs
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%driver%';
```

### **🐛 Dépannage Express**

```sql
-- Profil bloqué en "incomplete" ?
SELECT * FROM force_update_driver_status('user-uuid');

-- Trigger ne fonctionne pas ?
DROP TRIGGER IF EXISTS trigger_auto_update_driver_status ON drivers;
-- Puis relancer add-triggers-only.sql

-- Permissions 403 ?
SELECT get_user_role(); -- Vérifier le rôle
```

---

## 📊 **DASHBOARD ADMIN EN REACT**

```typescript
// components/AdminDashboard.tsx
export const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_drivers_completeness_stats')
        .single()
      if (error) throw error
      return data
    },
    refetchInterval: 60000 // Refresh toutes les minutes
  })

  const { data: incompleteDrivers } = useQuery({
    queryKey: ['incomplete-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_incomplete_drivers_report')
      if (error) throw error
      return data
    }
  })

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Chauffeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_drivers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profils Complets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.complete_drivers || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profils Incomplets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.incomplete_drivers || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de Complétude</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.average_completion_percentage?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des profils incomplets */}
      <Card>
        <CardHeader>
          <CardTitle>Profils à Compléter</CardTitle>
        </CardHeader>
        <CardContent>
          {incompleteDrivers?.map((driver) => (
            <div key={driver.user_id} className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">{driver.first_name} {driver.last_name}</p>
                <p className="text-sm text-gray-600">
                  {driver.completion_percentage}% • {driver.missing_fields.join(', ')}
                </p>
              </div>
              <Badge variant={driver.status === 'incomplete' ? 'destructive' : 'secondary'}>
                {driver.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🎯 **CHECKLIST DÉPLOIEMENT**

### **✅ Pré-déploiement**
- [ ] Scripts SQL exécutés dans l'ordre
- [ ] Triggers créés et actifs
- [ ] Politiques RLS configurées
- [ ] Tests de fonctions réalisés

### **✅ Post-déploiement**
- [ ] `fix_all_driver_statuses()` exécuté
- [ ] Statistiques vérifiées
- [ ] Frontend testé avec un profil
- [ ] Monitoring configuré

### **✅ Validation Finale**
- [ ] Upload de document → statut automatique
- [ ] Profil complet → `pending_validation`
- [ ] Profil incomplet → `incomplete`
- [ ] Admin peut voir tous les profils
- [ ] Chauffeur voit son profil uniquement

---

**🎉 Avec ce système, vous avez une gestion automatisée et robuste de vos profils chauffeurs !**
