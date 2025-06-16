/**
 * Page de gestion des chauffeurs pour l'admin
 */
import { Suspense } from 'react'
import { DriversManagement } from '@/components/admin/drivers/DriversManagement'
import { SectionLoading } from '@/components/ui/loading'

export default function AdminDriversPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Gestion des Chauffeurs
          </h1>
          <p className="text-gray-300 mt-2">
            Gérez les chauffeurs de votre flotte
          </p>
        </div>
      </div>

      <Suspense fallback={<SectionLoading text="Chargement des chauffeurs..." />}>
        <DriversManagement />
      </Suspense>
    </div>
  )
}