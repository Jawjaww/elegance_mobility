import { NextResponse } from 'next/server'
import { getDashboardMetrics } from '@/lib/services/dashboard'

export async function GET() {
  try {
    const metrics = await getDashboardMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Erreur API metrics:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
