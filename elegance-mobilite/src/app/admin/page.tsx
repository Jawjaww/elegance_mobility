import { Card } from '@/components/ui/card'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Courses aujourd&apos;hui</h3>
          <p className="text-2xl font-bold mt-2">0</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Chauffeurs actifs</h3>
          <p className="text-2xl font-bold mt-2">0</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Véhicules disponibles</h3>
          <p className="text-2xl font-bold mt-2">0</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Revenus aujourd&apos;hui</h3>
          <p className="text-2xl font-bold mt-2">0€</p>
        </Card>
      </div>
    </div>
  )
}