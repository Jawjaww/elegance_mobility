'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Phone, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DriverInfo {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  phone: string | null
  rating?: number
  vehicle_type?: string | null
  vehicle_license_plate?: string | null
  vehicle_make?: string | null
  vehicle_model?: string | null
}

interface DriverCardProps {
  driver: DriverInfo
  showContactButtons?: boolean
  compact?: boolean
  className?: string
}

export function DriverCard({ 
  driver, 
  showContactButtons = false, 
  compact = false,
  className = ""
}: DriverCardProps) {
  const fullName = `${driver.first_name || ''} ${driver.last_name || ''}`.trim()
  const fallback = (driver.first_name?.[0] || '') + (driver.last_name?.[0] || '') || 'CH'
  
  const vehicleInfo = driver.vehicle_make && driver.vehicle_model 
    ? `${driver.vehicle_make} ${driver.vehicle_model}` 
    : null

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={driver.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            {fallback}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fullName || 'Chauffeur'}
          </p>
          {driver.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-500">{driver.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={driver.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
              {fallback}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {fullName || 'Chauffeur'}
              </h3>
              {driver.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-gray-700">
                    {driver.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            
            {vehicleInfo && (
              <p className="text-sm text-gray-600 mb-1">
                {vehicleInfo}
                {driver.vehicle_license_plate && (
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                    {driver.vehicle_license_plate}
                  </span>
                )}
              </p>
            )}
            
            {driver.vehicle_type && (
              <Badge variant="outline" className="mb-3">
                {driver.vehicle_type}
              </Badge>
            )}
            
            {showContactButtons && driver.phone && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-1" />
                  Appeler
                </Button>
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Version simple pour affichage dans les tableaux
export function DriverMini({ driver, className = "" }: { driver: DriverInfo, className?: string }) {
  return <DriverCard driver={driver} compact className={className} />
}
