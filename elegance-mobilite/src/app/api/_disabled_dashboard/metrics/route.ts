import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function baseHeaders() {
  return {
    apikey: SERVICE_KEY || '',
    Authorization: `Bearer ${SERVICE_KEY || ''}`,
    "Content-Type": "application/json",
    Prefer: 'count=exact',
  }
}

async function count(table: string, filter?: string) {
  if (!SUPABASE_URL) {
    console.error('[metrics] NEXT_PUBLIC_SUPABASE_URL is not defined')
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  }
  if (!SERVICE_KEY) {
    console.error('[metrics] SUPABASE_SERVICE_ROLE_KEY is not defined')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }

  const url = new URL(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`)
  if (filter) {
    url.search = filter
  }
  url.searchParams.set('select', 'id')
  url.searchParams.set('limit', '0')

  console.log(`[metrics] Fetching count for ${table}, URL: ${url.toString()}`)
  
  const res = await fetch(url.toString(), {
    headers: {
      ...baseHeaders(),
      Range: '0-0',
    },
  })

  if (!res.ok) {
    const txt = await res.text()
    console.error(`[metrics] ${table} query failed: ${res.status}`, txt)
    throw new Error(`${table} query failed: ${res.status} ${txt}`)
  }

  const countHeader = res.headers.get('content-range') || ''
  // content-range format: 0-0/123
  const parts = countHeader.split('/')
  const total = parts[1] ? parseInt(parts[1], 10) : null
  return total ?? 0
}

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const [
      todayRides,
      pendingRides,
      activeDrivers,
      remainingRides,
      availableVehicles,
      yesterdayRides,
    ] = await Promise.all([
      count("rides", `date=eq.${today}`),
      count("rides", `status=eq.pending`),
      count("drivers", `status=eq.active`),
      count("rides", `status=in.(pending,scheduled)`),
      count("vehicles", `status=eq.available`),
      count("rides", `date=eq.${yesterdayStr}`),
    ]);

    const trendPercentage = yesterdayRides
      ? ((todayRides - yesterdayRides) / yesterdayRides) * 100
      : 0;

    return NextResponse.json({
      todayRides,
      pendingRides,
      activeDrivers,
      remainingRides,
      availableVehicles,
      todayRidesTrend: {
        percentage: Math.abs(trendPercentage),
        isUp: trendPercentage >= 0,
      },
    });
  } catch (error: any) {
    console.error("[metrics] Error /api/dashboard/metrics:", error);
    console.error("[metrics] Error stack:", error?.stack);
    return NextResponse.json(
      { error: error?.message || "unknown", details: error?.stack },
      { status: 500 },
    );
  }
}
