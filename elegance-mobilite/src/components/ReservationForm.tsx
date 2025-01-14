'use client'

import { useState } from 'react'
import { createReservation } from '../lib/reservationService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import toast from 'react-hot-toast'

export default function ReservationForm() {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    pickup_date: '',
    pickup_time: '',
    pickup_address: '',
    dropoff_address: '',
    vehicle_type: 'standard',
    special_requests: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createReservation(formData)
      toast.success('Votre réservation a bien été enregistrée.')
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        pickup_date: '',
        pickup_time: '',
        pickup_address: '',
        dropoff_address: '',
        vehicle_type: 'standard',
        special_requests: ''
      })
    } catch (error) {
      toast.error('Une erreur est survenue lors de la réservation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_name">Nom complet</Label>
          <Input
            id="client_name"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_email">Email</Label>
          <Input
            id="client_email"
            type="email"
            value={formData.client_email}
            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Rest of form fields... */}

      <Button type="submit" disabled={loading}>
        {loading ? 'En cours...' : 'Réserver'}
      </Button>
    </form>
  )
}