"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { useOptionsStore } from "../../../lib/optionsStore"

export default function OptionsPage() {
  const { options } = useOptionsStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des options</h1>
      </div>
      
      <DataTable
        columns={columns}
        data={options}
        searchKey="type"
      />
    </div>
  )
}
