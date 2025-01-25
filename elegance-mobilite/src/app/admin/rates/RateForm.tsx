"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import * as Form from "@radix-ui/react-form"
import { useRatesStore } from "../../../lib/ratesStore"
import { useToast } from "@/components/ui/toast"
import { z } from "zod"
import { VehicleCategory } from "../../../lib/types"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"

const rateSchema = z.object({
  type: z.enum(['STANDARD', 'PREMIUM', 'VIP']),
  baseRate: z.number().min(0, "Le tarif doit être positif"),
  peakRate: z.number().min(0, "Le tarif doit être positif"),
  nightRate: z.number().min(0, "Le tarif doit être positif"),
})

export default function RateForm({ rate, onSuccess }: {
  rate?: VehicleCategory,
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const { createRate, updateRate } = useRatesStore()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof rateSchema>>({
    resolver: zodResolver(rateSchema),
    defaultValues: rate || {
      type: "STANDARD",
      baseRate: 0,
      peakRate: 0,
      nightRate: 0
    }
  })

  const onSubmit = async (values: z.infer<typeof rateSchema>) => {
    try {
      if (rate) {
        if (!rate?.id) throw new Error("ID manquant")
        await updateRate(rate.id, values)
      } else {
        const { ...rateData } = values;
        await createRate(rateData)
      }
      toast({
        title: "Succès",
        description: `Tarif ${rate ? "modifié" : "créé"} avec succès`,
      })
      setOpen(false)
      onSuccess?.()
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de ${rate ? "la modification" : "la création"} du tarif`,
      })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un tarif
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>
          {rate ? "Modifier le tarif" : "Créer un nouveau tarif"}
        </Dialog.Title>
        <Dialog.Description>
          Remplissez les informations ci-dessous pour {rate ? "modifier" : "créer"} un tarif.
        </Dialog.Description>
        <Form.Root onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Form.Field>
              <Form.Label>Type de véhicule</Form.Label>
              <Input {...form.register("type")} />
              <Form.Message />
            </Form.Field>
            <Form.Field>
              <Form.Label>Tarif de base</Form.Label>
              <Input type="number" {...form.register("baseRate", { valueAsNumber: true })} />
              <Form.Message />
            </Form.Field>
            <Form.Field>
              <Form.Label>Tarif heure de pointe</Form.Label>
              <Input type="number" {...form.register("peakRate", { valueAsNumber: true })} />
              <Form.Message />
            </Form.Field>
            <Form.Field>
              <Form.Label>Tarif de nuit</Form.Label>
              <Input type="number" {...form.register("nightRate", { valueAsNumber: true })} />
              <Form.Message />
            </Form.Field>
            <Button type="submit">
              {rate ? "Modifier" : "Créer"}
            </Button>
          </div>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  )
}