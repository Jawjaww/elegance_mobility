'use client'

import { useState } from 'react'
import { createReservation } from '../lib/reservationService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useToast, ToastTitle, ToastDescription } from './ui/toast'

export default function ReservationForm() {
  const { toast } = useToast()
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
  const [errors, setErrors] = useState({
    client_email: '',
    client_phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Validate email format
    const validateEmail = (email: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    }

    // Validate email format
    const emailValid = validateEmail(formData.client_email);
    setErrors(prev => ({
      ...prev,
      client_email: emailValid ? '' : 'Veuillez entrer un email valide'
    }));

    // Validate phone number format (French format)
    const phoneValid = /^(\+33|0)[1-9](\d{2}){4}$/.test(formData.client_phone);
    setErrors(prev => ({
      ...prev,
      client_phone: phoneValid ? '' : 'Veuillez entrer un numéro de téléphone valide'
    }));

    if (!emailValid || !phoneValid) {
      setLoading(false);
      return;
    }

    try {
      await createReservation(formData)
      toast({
        children: (
          <>
            <ToastTitle>Succès</ToastTitle>
            <ToastDescription>
              Votre réservation a bien été enregistrée.
            </ToastDescription>
          </>
        )
      })
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
      console.error('Erreur lors de la réservation:', error);
      toast({
        variant: 'destructive',
        children: (
          <>
            <ToastTitle>Erreur</ToastTitle>
            <ToastDescription>
              Une erreur est survenue lors de la réservation.
            </ToastDescription>
          </>
        )
      })
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
            name="client_name"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            required
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_email">Email</Label>
          <Input
            id="client_email"
            name="client_email"
            type="email"
            aria-describedby="email-error"
            value={formData.client_email}
            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
            required
            aria-required="true"
          />
          {errors.client_email && (
            <p id="email-error" className="text-red-500 text-sm mt-1">
              {errors.client_email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_phone">Téléphone</Label>
          <Input
            id="client_phone"
            name="client_phone"
            type="tel"
            aria-describedby="phone-error"
            value={formData.client_phone}
            onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
            required
            aria-required="true"
          />
          {errors.client_phone && (
            <p id="phone-error" className="text-red-500 text-sm mt-1">
              {errors.client_phone}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickup_date">Date de prise en charge</Label>
          <Input
            id="pickup_date"
            name="pickup_date"
            type="date"
            value={formData.pickup_date}
            onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
            required
            aria-required="true"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickup_time">Heure de prise en charge</Label>
          <Input
            id="pickup_time"
            name="pickup_time"
            type="time"
            value={formData.pickup_time}
            onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
            required
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickup_address">Adresse de prise en charge</Label>
          <Input
            id="pickup_address"
            name="pickup_address"
            value={formData.pickup_address}
            onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
            required
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dropoff_address">Adresse de destination</Label>
          <Input
            id="dropoff_address"
            name="dropoff_address"
            value={formData.dropoff_address}
            onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
            required
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Type de véhicule</Label>
          <select
            id="vehicle_type"
            name="vehicle_type"
            value={formData.vehicle_type}
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
            aria-required="true"
            aria-label="Type de véhicule"
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="van">Van</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="special_requests">Demandes spéciales</Label>
        <textarea
          id="special_requests"
          name="special_requests"
          value={formData.special_requests}
          onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Demandes spéciales"
        />
      </div>

      <Button type="submit" disabled={loading} aria-disabled={loading}>
        {loading ? 'En cours...' : 'Réserver'}
      </Button>
    </form>
  )
}
