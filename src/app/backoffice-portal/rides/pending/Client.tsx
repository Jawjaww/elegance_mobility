"use client"
 
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore"
 
export default function PendingRidesPage() {
  const router = useRouter()
  const { setSelectedStatus } = useUnifiedRidesStore()
 
  useEffect(() => {
    // Définir le filtre sur "pending" avant la redirection
    setSelectedStatus("pending")
    router.replace("/backoffice-portal/rides?filter=pending")
  }, [router, setSelectedStatus])
 
  return null
}
