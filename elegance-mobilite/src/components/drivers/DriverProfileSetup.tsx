'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Phone, MapPin, Car, User as UserIcon, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/database/client';
import { useToast } from '@/hooks/useToast';
import { PageLoading, ButtonLoading } from '@/components/ui/loading';

interface DriverProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_color: string;
  vehicle_plate: string;
  address: string;
  city: string;
  postal_code: string;
}

export default function DriverProfileSetup({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [formData, setFormData] = useState<DriverProfileData>({
    first_name: '',
    last_name: '',
    phone: '',
    license_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    vehicle_plate: '',
    address: '',
    city: '',
    postal_code: ''
  });
  
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Vérifier si l'email vient d'être vérifié
    const verified = searchParams?.get('verified');
    if (verified === 'true') {
      setEmailVerified(true);
      toast({
        title: "Email confirmé !",
        description: "Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant compléter votre profil.",
      });
      
      // Nettoyer l'URL
      router.replace('/driver-portal/profile/setup', { scroll: false });
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        // Vérifier si le chauffeur a déjà un profil
        const { data: existingDriver } = await supabase
          .from('drivers')
          .select('id, status')
          .eq('user_id', user.id)
          .single();

        if (existingDriver) {
          // Le profil existe déjà, rediriger vers le dashboard
          router.push('/driver-portal/dashboard');
          return;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du profil existant:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [router, user.id]);

  const handleInputChange = (field: keyof DriverProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.first_name && formData.last_name && formData.phone);
      case 2:
        return !!(formData.license_number);
      case 3:
        return !!(formData.vehicle_make && formData.vehicle_model && formData.vehicle_year && formData.vehicle_color && formData.vehicle_plate);
      case 4:
        return !!(formData.address && formData.city && formData.postal_code);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !validateStep(4)) return;

    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('drivers')
        .insert({
          user_id: user.id,
          email: user.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          license_number: formData.license_number,
          vehicle_make: formData.vehicle_make,
          vehicle_model: formData.vehicle_model,
          vehicle_year: parseInt(formData.vehicle_year),
          vehicle_color: formData.vehicle_color,
          vehicle_plate: formData.vehicle_plate,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          status: 'pending', // En attente de validation admin
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Profil créé avec succès !",
        description: "Votre demande est en cours de validation par nos équipes.",
      });

      // Rediriger vers la page d'attente de validation
      router.push('/driver-portal/pending');
      
    } catch (error: any) {
      console.error('Erreur lors de la création du profil:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de votre profil.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoading text="Vérification de votre profil..." />;
  }

  const progress = (currentStep / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Configuration de votre profil chauffeur
        </h1>
        <p className="text-gray-600">
          Complétez votre profil pour commencer à recevoir des demandes de course
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Étape {currentStep} sur 4
            </CardTitle>
            <Badge variant="secondary">
              {Math.round(progress)}% complété
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <UserIcon className="h-5 w-5" />}
            {currentStep === 2 && <AlertCircle className="h-5 w-5" />}
            {currentStep === 3 && <Car className="h-5 w-5" />}
            {currentStep === 4 && <MapPin className="h-5 w-5" />}
            {currentStep === 1 && "Informations personnelles"}
            {currentStep === 2 && "Permis de conduire"}
            {currentStep === 3 && "Informations du véhicule"}
            {currentStep === 4 && "Adresse"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Vos informations de base"}
            {currentStep === 2 && "Votre permis de conduire"}
            {currentStep === 3 && "Les détails de votre véhicule"}
            {currentStep === 4 && "Votre adresse de résidence"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <Label htmlFor="license_number">Numéro de permis de conduire *</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                placeholder="Votre numéro de permis"
              />
              <p className="text-sm text-gray-500 mt-2">
                Ce numéro sera vérifié lors de la validation de votre profil
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_make">Marque *</Label>
                <Input
                  id="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={(e) => handleInputChange('vehicle_make', e.target.value)}
                  placeholder="ex: Renault"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_model">Modèle *</Label>
                <Input
                  id="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
                  placeholder="ex: Clio"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_year">Année *</Label>
                <Input
                  id="vehicle_year"
                  type="number"
                  value={formData.vehicle_year}
                  onChange={(e) => handleInputChange('vehicle_year', e.target.value)}
                  placeholder="2020"
                  min="2000"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_color">Couleur *</Label>
                <Input
                  id="vehicle_color"
                  value={formData.vehicle_color}
                  onChange={(e) => handleInputChange('vehicle_color', e.target.value)}
                  placeholder="ex: Blanc"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="vehicle_plate">Plaque d'immatriculation *</Label>
                <Input
                  id="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={(e) => handleInputChange('vehicle_plate', e.target.value.toUpperCase())}
                  placeholder="AA-123-BB"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Rue de la Paix"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Code postal *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="75001"
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Précédent
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Suivant
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(4) || submitting}
              >
                {submitting ? (
                  <ButtonLoading />
                ) : (
                  'Créer mon profil'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert className="mt-6">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Une fois votre profil soumis, nos équipes procéderont à sa validation.
          Vous recevrez une notification par email dès que votre compte sera activé.
        </AlertDescription>
      </Alert>
    </div>
  );
}
