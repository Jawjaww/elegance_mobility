'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { debugRlsProblem, supabase } from '@/lib/database/client';

export default function DebugRls() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<any>(null);

  const handleDebug = async () => {
    try {
      const diagnostic = await debugRlsProblem();
      setResult(diagnostic);
      setError(null);
    } catch (err) {
      setError(`Erreur: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const testInsertion = async () => {
    try {
      // Récupérer l'utilisateur actuel
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Erreur utilisateur: ${userError.message}`);
      }
      
      if (!userData.user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Créer un objet de test
      const testRide = {
        user_id: userData.user.id,
        driver_id: null,
        origin_address: "Adresse test",
        destination_address: "Destination test",
        pickup_datetime: new Date().toISOString(),
        distance: 10,
        duration: 20,
        status: "pending",
        price: 25.50,
        vehicle_type: "STANDARD",
        created_at: new Date().toISOString()
      };

      console.log("[TEST RLS] Tentative d'insertion:", testRide);
      
      // Tenter l'insertion
      const { data, error } = await supabase
        .from('rides')
        .insert(testRide)
        .select();
      
      if (error) {
        throw new Error(`Erreur d'insertion: ${error.message} (Code: ${error.code})`);
      }
      
      setTestData({ success: true, data });
      setError(null);
    } catch (err) {
      setError(`Erreur de test: ${err instanceof Error ? err.message : String(err)}`);
      setTestData({ success: false });
    }
  };

  return (
    <Card className="p-6 my-4 bg-neutral-900">
      <h2 className="text-xl font-semibold mb-4">Outil de diagnostic RLS</h2>
      
      <div className="flex space-x-4 mb-6">
        <Button onClick={handleDebug} variant="outline">
          Diagnostiquer RLS
        </Button>
        
        <Button onClick={testInsertion} variant="outline">
          Tester insertion
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-900/30 p-4 rounded-md mb-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-neutral-800 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Résultat du diagnostic</h3>
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {testData && (
        <div className={`mt-4 p-4 rounded-md ${testData.success ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
          <h3 className="text-lg font-medium mb-2">Résultat du test d'insertion</h3>
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}
