'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, User, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/database/client';
import { useToast } from '@/hooks/useToast';
import { ButtonLoading } from '@/components/ui/loading';

interface CustomerFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export default function CustomerSignup() {
  const [formData, setFormData] = useState<CustomerFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('🔐 Création du compte client...')
      
      // Créer le compte utilisateur (le rôle sera automatiquement défini par le trigger PostgreSQL)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            // user_metadata : données utilisateur uniquement
            portal_type: 'customer', // Utilisé par le trigger pour définir le rôle dans app_metadata
            full_name: `${formData.firstName} ${formData.lastName}`,
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email?type=email_confirmation&next=/client-portal/dashboard`
        }
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Compte existant",
            description: "Un compte existe déjà avec cette adresse email",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      console.log('✅ Compte créé avec succès:', data.user?.id);
      setSuccess(true);

    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du compte",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 bg-elegant-gradient">
        <Card className="w-full max-w-md elegant-backdrop">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-400">Compte créé !</CardTitle>
            <CardDescription className="text-neutral-300">
              Votre compte client a été créé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-neutral-800/50 border-neutral-700">
              <Mail className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-neutral-200">
                <strong className="text-white">Confirmez votre email</strong><br />
                Un email de confirmation a été envoyé à <strong className="text-blue-400">{formData.email}</strong>. 
                Cliquez sur le lien dans l'email pour activer votre compte.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-neutral-400">
                Après confirmation, vous pourrez vous connecter à votre espace client
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/auth/login')}
                className="w-full btn-secondary"
              >
                Aller à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 bg-elegant-gradient">
      <Card className="w-full max-w-md elegant-backdrop">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-neutral-100">
            Créer un compte client
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Rejoignez Élégance Mobilité pour réserver vos courses
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <Label htmlFor="firstName" className="text-neutral-200">Prénom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Votre prénom"
                    className="pl-10 input-elegant"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <Label htmlFor="lastName" className="text-neutral-200">Nom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Votre nom"
                    className="pl-10 input-elegant"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="email" className="text-neutral-200">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="votre@email.com"
                  className="pl-10 input-elegant"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="password" className="text-neutral-200">Mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Votre mot de passe"
                  className="pl-10 input-elegant"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="confirmPassword" className="text-neutral-200">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  className="pl-10 input-elegant"
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full btn-gradient text-white"
              disabled={loading}
            >
              {loading ? (
                <ButtonLoading />
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <User className="h-4 w-4" />
                  Créer mon compte
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              Déjà un compte ?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-blue-400 hover:text-blue-300"
                onClick={() => router.push('/auth/login')}
              >
                Se connecter
              </Button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-400">
              Vous êtes chauffeur ?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-blue-400 hover:text-blue-300"
                onClick={() => router.push('/auth/signup/driver')}
              >
                Inscription chauffeur
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
