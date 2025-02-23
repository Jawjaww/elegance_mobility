"use client"
 
import { useRouter } from "next/navigation"
import { useEffect } from "react"
 
export default function CoursesPage() {
  const router = useRouter()
 
  useEffect(() => {
    router.replace("/admin/rides")
  }, [router])
 
  return null
}
