"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useDriverValidation } from "@/hooks/useDriverSignup"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/database/client"
import { useRouter } from "next/navigation"

interface PendingDriver {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  vtc_card_number: string
  driving_license_number: string
  vtc_card_expiry_date: string
  created_at: string
}

export default function PendingDriversPage() {
  const router = useRouter()
  const { validateDriver, isLoading: isValidating } = useDriverValidation()
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  // Charger les chauffeurs en attente
  const loadPendingDrivers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("drivers")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          vtc_card_number,
          driving_license_number,
          vtc_card_expiry_date,
          created_at
        `)
        .eq("status", "pending_validation")
        .order("created_at", { ascending: false })

      if (error) throw error

      setPendingDrivers(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des chauffeurs:", error)
    } finally {
      setLoading(false)
    }
  }

  // Charger les données au montage et lors des changements
  useEffect(() => {
    loadPendingDrivers()

    // Configurer la subscription pour les mises à jour en temps réel
    const subscription = supabase
      .channel('pending-drivers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
          filter: 'status=eq.pending_validation'
        },
        () => {
          loadPendingDrivers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Gérer la validation
  const handleValidate = async (driver: PendingDriver) => {
    const result = await validateDriver(driver.id, true)
    if (result.success) {
      await loadPendingDrivers()
    }
  }

  // Gérer le rejet
  const handleReject = async (driver: PendingDriver) => {
    setSelectedDriver(driver)
    setShowRejectDialog(true)
  }

  // Confirmer le rejet
  const confirmReject = async () => {
    if (!selectedDriver) return

    const result = await validateDriver(selectedDriver.id, false, rejectionReason)
    if (result.success) {
      setShowRejectDialog(false)
      setRejectionReason("")
      setSelectedDriver(null)
      await loadPendingDrivers()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Chauffeurs en attente de validation</h1>
      
      {pendingDrivers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-neutral-400">
              Aucun chauffeur en attente de validation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingDrivers.map(driver => (
            <Card key={driver.id} className="bg-neutral-900 border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {driver.first_name} {driver.last_name}
                  </h2>
                  <p className="text-sm text-neutral-400">{driver.email}</p>
                </div>
                <div className="space-x-2">
                  <Button
                    onClick={() => handleValidate(driver)}
                    disabled={isValidating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Valider
                  </Button>
                  <Button
                    onClick={() => handleReject(driver)}
                    disabled={isValidating}
                    variant="destructive"
                  >
                    Refuser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-400">Téléphone</p>
                    <p>{driver.phone}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Carte VTC</p>
                    <p>{driver.vtc_card_number}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Permis</p>
                    <p>{driver.driving_license_number}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Date d'inscription</p>
                    <p>{new Date(driver.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motif du rejet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du rejet</Label>
              <Input
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez la raison du rejet"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowRejectDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || isValidating}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}