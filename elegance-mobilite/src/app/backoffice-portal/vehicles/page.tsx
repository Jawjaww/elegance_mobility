"use client"
 
import { useRouter } from "next/navigation"
import { useEffect } from "react"
 
export default function VehiclesPage() {
  const router = useRouter()
 
  useEffect(() => {
    router.replace("/admin/vehicles")
  }, [router])
 
  return null
}
