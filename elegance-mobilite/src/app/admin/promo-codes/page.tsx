"use client"
 
import { useRouter } from "next/navigation"
import { useEffect } from "react"
 
export default function PromoCodesPage() {
  const router = useRouter()
 
  useEffect(() => {
    router.replace("/admin/promo-codes")
  }, [router])
 
  return null
}
