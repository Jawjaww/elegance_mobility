'use server'

import { createServerSupabaseClient } from "@/lib/database/server"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import { getAppRole } from '@/lib/types/common.types'

export default async function CustomerPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || getAppRole(user as any) !== 'app_customer') {
    redirect('/auth/login?from=account')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
