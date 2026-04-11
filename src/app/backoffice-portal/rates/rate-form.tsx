import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Rate } from '@/lib/services/pricingService';

interface RateFormProps {
  onSubmit: (rate: Rate) => Promise<void>;
  initialData?: Rate;
  mode?: 'create' | 'edit';
}

export function RateForm({ onSubmit, initialData, mode = 'create' }: RateFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Rate>>(
    initialData || {
      vehicleType: '',
      pricePerKm: 0,
      basePrice: 0
    }
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.vehicleType || !formData.pricePerKm || !formData.basePrice) {
        throw new Error('Tous les champs sont requis');
      }

      await onSubmit(formData as Rate);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'create' ? 'default' : 'outline'}>
          {mode === 'create' ? 'Ajouter un tarif' : 'Modifier'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-neutral-100">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouveau tarif' : 'Modifier le tarif'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid w-full gap-2">
            <Label htmlFor="vehicleType">Type de véhicule</Label>
            <Input
              id="vehicleType"
              type="text"
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              disabled={mode === 'edit'}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="grid w-full gap-2">
            <Label htmlFor="basePrice">Prix de base (€)</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="grid w-full gap-2">
            <Label htmlFor="pricePerKm">Prix par km (€)</Label>
            <Input
              id="pricePerKm"
              type="number"
              step="0.01"
              min="0"
              value={formData.pricePerKm}
              onChange={(e) => setFormData({ ...formData, pricePerKm: parseFloat(e.target.value) })}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}