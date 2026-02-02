"use client"
 
import { useRouter } from "next/navigation"
import { useEffect } from "react"
 
export default function RatesPage() {
  const router = useRouter()
 
  useEffect(() => {
    router.replace("/admin/rates")
  }, [router])
 
  return null
}
