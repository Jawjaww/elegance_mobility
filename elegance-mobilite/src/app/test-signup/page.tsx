'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/database/client';

export default function TestSignupPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testDriverSignup = async () => {
    setLoading(true);
    addResult('🔐 Test inscription driver...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `test-driver-${Date.now()}@example.com`,
        password: 'password123',
        options: {
          data: {
            portal_type: 'driver',
            first_name: 'Test',
            last_name: 'Driver',
            full_name: 'Test Driver'
          }
        }
      });

      if (error) {
        addResult(`❌ Erreur: ${error.message}`);
        return;
      }

      addResult(`✅ Utilisateur créé: ${data.user?.email}`);
      addResult(`📋 portal_type: ${data.user?.user_metadata?.portal_type}`);
      addResult(`📋 Rôle assigné: ${data.user?.app_metadata?.role}`);
      
      const role = data.user?.app_metadata?.role;
      if (role === 'app_driver') {
        addResult('✅ Rôle correctement assigné: app_driver');
      } else {
        addResult(`❌ Rôle incorrect: ${role} (attendu: app_driver)`);
      }
      
    } catch (error: any) {
      addResult(`❌ Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCustomerSignup = async () => {
    setLoading(true);
    addResult('👤 Test inscription customer...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `test-customer-${Date.now()}@example.com`,
        password: 'password123',
        options: {
          data: {
            portal_type: 'customer',
            first_name: 'Test',
            last_name: 'Customer',
            full_name: 'Test Customer'
          }
        }
      });

      if (error) {
        addResult(`❌ Erreur: ${error.message}`);
        return;
      }

      addResult(`✅ Utilisateur créé: ${data.user?.email}`);
      addResult(`📋 portal_type: ${data.user?.user_metadata?.portal_type}`);
      addResult(`📋 Rôle assigné: ${data.user?.app_metadata?.role}`);
      
      const role = data.user?.app_metadata?.role;
      if (role === 'app_customer') {
        addResult('✅ Rôle correctement assigné: app_customer');
      } else {
        addResult(`❌ Rôle incorrect: ${role} (attendu: app_customer)`);
      }
      
    } catch (error: any) {
      addResult(`❌ Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignupWithoutPortalType = async () => {
    setLoading(true);
    addResult('🚫 Test inscription sans portal_type...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `test-no-portal-${Date.now()}@example.com`,
        password: 'password123',
        options: {
          data: {
            first_name: 'Test',
            last_name: 'NoPortal',
            full_name: 'Test NoPortal'
          }
        }
      });

      if (error) {
        addResult(`✅ Erreur attendue: ${error.message}`);
      } else {
        addResult('❌ L\'inscription a réussi alors qu\'elle devrait échouer');
        addResult(`📋 Rôle assigné: ${data.user?.app_metadata?.role}`);
      }
      
    } catch (error: any) {
      addResult(`✅ Exception attendue: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Test d'inscription Supabase</CardTitle>
            <CardDescription>
              Tester les inscriptions driver/customer et vérifier l'assignation des rôles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={testDriverSignup} 
                disabled={loading}
                variant="default"
              >
                Test Driver Signup
              </Button>
              
              <Button 
                onClick={testCustomerSignup} 
                disabled={loading}
                variant="secondary"
              >
                Test Customer Signup
              </Button>
              
              <Button 
                onClick={testSignupWithoutPortalType} 
                disabled={loading}
                variant="destructive"
              >
                Test Sans portal_type
              </Button>
              
              <Button 
                onClick={clearResults} 
                disabled={loading}
                variant="outline"
              >
                Effacer les résultats
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Résultats des tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-900 p-4 rounded-lg min-h-[200px] max-h-[600px] overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-neutral-400 italic">Aucun test exécuté</p>
              ) : (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm font-mono text-neutral-300">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-neutral-300 space-y-2">
            <p>1. <strong>Test Driver Signup</strong> : Doit créer un utilisateur avec le rôle <code>app_driver</code></p>
            <p>2. <strong>Test Customer Signup</strong> : Doit créer un utilisateur avec le rôle <code>app_customer</code></p>
            <p>3. <strong>Test Sans portal_type</strong> : Doit échouer avec une erreur du trigger</p>
            <p className="text-yellow-400 mt-4">
              💡 Si les rôles ne sont pas correctement assignés, le trigger SQL n'est pas appliqué ou ne fonctionne pas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
