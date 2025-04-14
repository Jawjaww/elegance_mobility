"use client"

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

// Client Supabase minimal avec typage strict pour les composants clients
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
