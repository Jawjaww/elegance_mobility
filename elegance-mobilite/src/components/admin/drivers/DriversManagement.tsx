"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Phone, Mail, MapPin, User, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { SectionLoading } from '@/components/ui/loading'

interface Driver {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  phone: string
  email: string
  license_number: string
  status: 'active' | 'inactive' | 'pending_validation' | 'suspended'
  vehicle_make?: string
  vehicle_model?: string
  vehicle_license_plate?: string
  address?: string
  created_at: string
  updated_at: string
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending_validation: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800'
}

const statusLabels = {
  active: 'Actif',
  inactive: 'Inactif',
  pending_validation: 'En attente',
  suspended: 'Suspendu'
}

export function DriversManagement() {
  const { toast } = useToast()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingDriver, setAddingDriver] = useState(false)
  const [newDriver, setNewDriver] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    license_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_license_plate: '',
    address: ''
  })

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    try {
      console.log('🔄 Chargement des chauffeurs...')
      
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors du chargement des chauffeurs:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les chauffeurs: " + error.message,
          variant: "destructive"
        })
        return
      }

      console.log('✅ Chauffeurs chargés:', { count: data?.length || 0, data })
      setDrivers(data || [])
      
      if (!data || data.length === 0) {
        toast({
          title: "Aucun chauffeur",
          description: "Aucun chauffeur trouvé. Vous pouvez en ajouter un avec le bouton ci-dessus.",
          variant: "default"
        })
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err)
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addDriver = async () => {
    if (!newDriver.first_name || !newDriver.last_name || !newDriver.phone || !newDriver.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setAddingDriver(true)
    
    try {
      const { data, error } = await supabase
        .from('drivers')
        .insert([{
          ...newDriver,
          status: 'pending_validation'
        }])
        .select()

      if (error) {
        console.error('❌ Erreur lors de l\'ajout:', error)
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter le chauffeur: " + error.message,
          variant: "destructive"
        })
        return
      }

      console.log('✅ Chauffeur ajouté:', data)
      toast({
        title: "Succès",
        description: "Chauffeur ajouté avec succès",
        variant: "default"
      })

      // Reset form and reload
      setNewDriver({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        license_number: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_license_plate: '',
        address: ''
      })
      setShowAddForm(false)
      loadDrivers()

    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout:', err)
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      })
    } finally {
      setAddingDriver(false)
    }
  }

  const updateDriverStatus = async (driverId: string, newStatus: Driver['status']) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: newStatus })
        .eq('id', driverId)

      if (error) {
        console.error('❌ Erreur lors de la mise à jour:', error)
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut: " + error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Succès",
        description: "Statut mis à jour avec succès",
        variant: "default"
      })

      loadDrivers()
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour:', err)
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      })
    }
  }

  const filteredDrivers = drivers.filter(driver => 
    `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  )

  if (loading) {
    return <SectionLoading text="Chargement des chauffeurs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un chauffeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un chauffeur
        </Button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Nouveau chauffeur</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Prénom *"
              value={newDriver.first_name}
              onChange={(e) => setNewDriver({...newDriver, first_name: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="Nom *"
              value={newDriver.last_name}
              onChange={(e) => setNewDriver({...newDriver, last_name: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="Téléphone *"
              value={newDriver.phone}
              onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="Email *"
              type="email"
              value={newDriver.email}
              onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="Numéro de permis"
              value={newDriver.license_number}
              onChange={(e) => setNewDriver({...newDriver, license_number: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="Adresse"
              value={newDriver.address}
              onChange={(e) => setNewDriver({...newDriver, address: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              placeholder="Marque véhicule"
              value={newDriver.vehicle_make}
              onChange={(e) => setNewDriver({...newDriver, vehicle_make: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="Modèle véhicule"
              value={newDriver.vehicle_model}
              onChange={(e) => setNewDriver({...newDriver, vehicle_model: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="Plaque véhicule"
              value={newDriver.vehicle_license_plate}
              onChange={(e) => setNewDriver({...newDriver, vehicle_license_plate: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={addDriver}
              disabled={addingDriver}
              className="bg-green-600 hover:bg-green-700"
            >
              {addingDriver ? 'Ajout...' : 'Ajouter'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Liste des chauffeurs */}
      {drivers.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucun chauffeur</h3>
          <p className="text-gray-400 mb-6">
            Aucun chauffeur n'est enregistré dans le système.
          </p>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ajouter le premier chauffeur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-700 p-2 rounded-full">
                    <User className="h-5 w-5 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {driver.first_name} {driver.last_name}
                    </h3>
                    <Badge className={statusColors[driver.status]}>
                      {statusLabels[driver.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{driver.email}</span>
                </div>
                {driver.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{driver.address}</span>
                  </div>
                )}
                {driver.vehicle_make && driver.vehicle_model && (
                  <div className="text-xs bg-gray-700 p-2 rounded mt-3">
                    <div><strong>Véhicule:</strong> {driver.vehicle_make} {driver.vehicle_model}</div>
                    {driver.vehicle_license_plate && (
                      <div><strong>Plaque:</strong> {driver.vehicle_license_plate}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex gap-2 flex-wrap">
                  {driver.status !== 'active' && (
                    <Button
                      size="sm"
                      onClick={() => updateDriverStatus(driver.id, 'active')}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      Activer
                    </Button>
                  )}
                  {driver.status !== 'inactive' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDriverStatus(driver.id, 'inactive')}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                    >
                      Désactiver
                    </Button>
                  )}
                  {driver.status !== 'suspended' && (
                    <Button
                      size="sm"
                      onClick={() => updateDriverStatus(driver.id, 'suspended')}
                      className="bg-red-600 hover:bg-red-700 text-xs"
                    >
                      Suspendre
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDrivers.length === 0 && drivers.length > 0 && (
        <div className="text-center py-8 text-gray-400">
          Aucun chauffeur ne correspond à votre recherche.
        </div>
      )}
    </div>
  )
}
