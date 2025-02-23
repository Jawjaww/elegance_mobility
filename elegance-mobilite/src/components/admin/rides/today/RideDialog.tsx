"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRunDialog } from "@/hooks/useRunDialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRunsStore } from "@/lib/stores/runsStore"
import { useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"

const rideFormSchema = z.object({
  customer_name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  customer_phone: z.string().optional(),
  customer_email: z.string().email("Email invalide").optional(),
  delivery_address: z.string().min(5, "L'adresse doit faire au moins 5 caractères"),
  delivery_notes: z.string().optional(),
  time_window_start: z.date(),
  time_window_end: z.date(),
})

type RideFormValues = z.infer<typeof rideFormSchema>

export function RideDialog() {
  const { isOpen, run, onClose } = useRunDialog()
  const { fetchRuns, selectedDate } = useRunsStore()

  const form = useForm<RideFormValues>({
    resolver: zodResolver(rideFormSchema),
    defaultValues: {
      customer_name: "",
      delivery_address: "",
      time_window_start: new Date(),
      time_window_end: new Date(Date.now() + 30 * 60 * 1000),
    },
  })

  useEffect(() => {
    if (run) {
      form.reset({
        customer_name: run.customer_name,
        customer_phone: run.customer_phone,
        customer_email: run.customer_email,
        delivery_address: run.delivery_address,
        delivery_notes: run.delivery_notes,
        time_window_start: new Date(run.time_window_start),
        time_window_end: new Date(run.time_window_end),
      })
    }
  }, [run, form])

  const onSubmit = async (data: RideFormValues) => {
    try {
      // TODO: Implémenter la création/mise à jour via Supabase
      await fetchRuns(selectedDate)
      onClose()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{run ? "Modifier la course" : "Nouvelle course"}</DialogTitle>
            <DialogDescription>
              Remplissez les informations de la course ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_name" className="text-right">
                Client
              </Label>
              <Input
                id="customer_name"
                className="col-span-3"
                {...form.register("customer_name")}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_phone" className="text-right">
                Téléphone
              </Label>
              <Input
                id="customer_phone"
                className="col-span-3"
                {...form.register("customer_phone")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_email" className="text-right">
                Email
              </Label>
              <Input
                id="customer_email"
                type="email"
                className="col-span-3"
                {...form.register("customer_email")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery_address" className="text-right">
                Adresse
              </Label>
              <Input
                id="delivery_address"
                className="col-span-3"
                {...form.register("delivery_address")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Créneau</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(form.getValues("time_window_start"), "PP", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.getValues("time_window_start")}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue("time_window_start", date)
                            const end = new Date(date)
                            end.setHours(date.getHours() + 1)
                            form.setValue("time_window_end", end)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-[120px] justify-start text-left font-normal"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {format(form.getValues("time_window_start"), "HH:mm", { locale: fr })}
                  </Button>
                  <span>-</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-[120px] justify-start text-left font-normal"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {format(form.getValues("time_window_end"), "HH:mm", { locale: fr })}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery_notes" className="text-right">
                Notes
              </Label>
              <textarea
                id="delivery_notes"
                className="col-span-3 h-20 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...form.register("delivery_notes")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {run ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}