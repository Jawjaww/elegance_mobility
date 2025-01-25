"use client"

import { useEffect } from "react"
import { DataTable } from "../../../components/ui/data-table"
import { columns } from "./columns"
import { useRatesStore } from "../../../lib/ratesStore"
import { useToast } from "../../../components/ui/toast"
import RateForm from "./RateForm"

export default function RatesPage() {
  const { rates, fetchRates, deleteRate } = useRatesStore()
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchRates()
      } catch {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Erreur lors du chargement des tarifs",
        })
      }
    }
    loadData()
  }, [fetchRates, toast])

  const handleDelete = async (id: string) => {
    try {
      await deleteRate(id)
      toast({
        title: "Succès",
        description: "Tarif supprimé avec succès",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la suppression du tarif",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des tarifs</h1>
        <RateForm />
      </div>
      
      <DataTable
        columns={columns({ handleDelete })}
        data={rates}
        searchKey="type"
      />
    </div>
  )
}