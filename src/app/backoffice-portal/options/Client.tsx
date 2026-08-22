"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import OptionsGrid from "@/components/options/options-grid";
import {
  createOption,
  deleteOption,
  listOptions,
  updateOption,
  type OptionRow,
} from "@/lib/services/optionsAdminService";

type OptionFormState = {
  name: string;
  description: string;
  price: number;
  available: boolean;
};

const EMPTY_FORM: OptionFormState = {
  name: "",
  description: "",
  price: 0,
  available: true,
};

export default function AdminOptionsPage() {
  const { toast } = useToast();
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OptionRow | null>(null);
  const [form, setForm] = useState<OptionFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOptions();
      setOptions(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Impossible de charger les options",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (option: {
    id: string;
    name: string;
    description: string;
    price: number;
    available: boolean;
  }) => {
    const row = options.find((o) => o.id === option.id) ?? null;
    setEditing(row);
    setForm({
      name: option.name,
      description: option.description,
      price: option.price,
      available: option.available,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nom requis",
        description: "Le nom de l'option est obligatoire",
      });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateOption(editing.id, {
          name: form.name.trim(),
          description: form.description.trim() || form.name.trim(),
          price: form.price,
          available: form.available,
        });
        toast({ title: "Option mise à jour" });
      } else {
        await createOption({
          name: form.name.trim(),
          description: form.description.trim() || form.name.trim(),
          price: form.price,
          available: form.available,
        });
        toast({ title: "Option créée" });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Échec de l'enregistrement",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (option: { id: string; name: string }) => {
    if (!globalThis.confirm(`Supprimer l'option « ${option.name} » ?`)) {
      return;
    }
    try {
      await deleteOption(option.id);
      toast({ title: "Option supprimée" });
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Échec de la suppression",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">
            Options et services additionnels
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Configurer le prix et la disponibilité des options
          </p>
        </div>
        <Button onClick={openCreate}>Ajouter une option</Button>
      </div>

      {loading ? (
        <div className="min-h-[160px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <OptionsGrid
          options={options}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-neutral-900 text-neutral-100 border-neutral-700">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l'option" : "Nouvelle option"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="opt-name">Nom</Label>
              <Input
                id="opt-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opt-desc">Description</Label>
              <Input
                id="opt-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opt-price">Prix (€)</Label>
              <Input
                id="opt-price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number.parseFloat(e.target.value) || 0 })
                }
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="opt-available">Disponible</Label>
              <Switch
                id="opt-available"
                checked={form.available}
                onCheckedChange={(checked) =>
                  setForm({ ...form, available: checked })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
