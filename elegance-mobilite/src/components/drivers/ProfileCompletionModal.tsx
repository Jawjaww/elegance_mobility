'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDriverProfileCompleteness } from './ProfileIncompleteNotification'

interface ProfileCompletionModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function ProfileCompletionModal({ userId, isOpen, onClose }: ProfileCompletionModalProps) {
  const { data: completeness, refetch } = useDriverProfileCompleteness(userId)
  
  const handleProfileUpdated = () => {
    refetch() // Re-vérifier le profil après mise à jour
    onClose() // Fermer la modal
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Compléter votre profil chauffeur
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Indicateur de progression */}
          {completeness && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-orange-800">
                  Progression : {completeness.completion_percentage}%
                </span>
                <span className="text-xs text-orange-600">
                  {completeness.missing_fields.length} champs manquants
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completeness.completion_percentage}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Placeholder pour le formulaire de profil */}
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Formulaire de profil à intégrer
            </h3>
            <p className="text-gray-600 mb-4">
              Le composant ModernDriverProfileSetup sera intégré ici
            </p>
            <Button 
              onClick={handleProfileUpdated}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Simuler profil complété
            </Button>
          </div>
          
          {/* Instructions temporaires */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Champs à compléter :</h4>
            {completeness && (
              <ul className="text-sm text-blue-700 space-y-1">
                {completeness.missing_fields.map((field: string) => (
                  <li key={field} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {field === 'first_name' && 'Prénom'}
                    {field === 'phone' && 'Téléphone'}
                    {field === 'company_name' && 'Nom de l\'entreprise'}
                    {field === 'company_phone' && 'Téléphone entreprise'}
                    {field === 'driving_license_number' && 'Numéro de permis'}
                    {field === 'driving_license_expiry_date' && 'Date d\'expiration du permis'}
                    {field === 'vtc_card_number' && 'Numéro carte VTC'}
                    {field === 'vtc_card_expiry_date' && 'Date d\'expiration carte VTC'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
