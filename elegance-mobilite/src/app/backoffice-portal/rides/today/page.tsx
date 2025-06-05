"use client"
 
import { useRouter } from "next/navigation"
import { useEffect } from "react"
 
export default function TodayRidesPage() {
  const router = useRouter()
 
  useEffect(() => {
    router.replace("/backoffice-portal/rides")
  }, [router])
 
  return null
}
