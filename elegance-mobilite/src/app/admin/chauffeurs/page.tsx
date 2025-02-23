"use client"
 
import { useRouter } from "next/navigation"
import { useEffect } from "react"
 
export default function ChauffeursPage() {
  const router = useRouter()
 
  useEffect(() => {
    router.replace("/admin/chauffeurs")
  }, [router])
 
  return null
}
