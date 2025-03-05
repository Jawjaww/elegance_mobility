import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Récupérer les paramètres de filtrage depuis l'URL
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const driverId = searchParams.get('driverId')

    let query = supabase
      .from('rides')
      .select(`
        *,
        driver:drivers(
          first_name, 
          last_name, 
          company_name, 
          company_phone, 
          employee_phone, 
          employee_name
        )
      `)
      .order('pickup_time', { ascending: true })

    // Appliquer les filtres si présents
    if (date) {
      // Filtrer par date en comparant uniquement la partie date de pickup_time
      query = query.gte('pickup_time', `${date}T00:00:00`)
        .lte('pickup_time', `${date}T23:59:59`)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (driverId && driverId !== 'all') {
      query = query.eq('driver_id', driverId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new NextResponse(error.message, { status: 500 })
    }

    // Formater les données pour correspondre à la structure attendue par RidesList
    const rides = data ? data.map(ride => ({
      id: ride.id,
      pickup_address: ride.pickup_address,
      dropoff_address: ride.dropoff_address,
      scheduled_time: ride.pickup_time,
      status: ride.status,
      driver: ride.driver ? {
        first_name: ride.driver.first_name,
        last_name: ride.driver.last_name,
        company_name: ride.driver.company_name,
        company_phone: ride.driver.company_phone,
        employee_phone: ride.driver.employee_phone,
        employee_name: ride.driver.employee_name
      } : undefined
    })) : []

    return NextResponse.json({ rides })
  } catch (error) {
    console.error('Server error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await request.json()
    
    const { data, error } = await supabase
      .from('rides')
      .insert([{ ...json, user_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new NextResponse(error.message, { status: 500 })
    }

    // Formater les données pour correspondre à la structure attendue par RidesList
    const rides = data ? [data].map(ride => ({
      id: ride.id,
      pickup_address: ride.pickup_address,
      dropoff_address: ride.dropoff_address,
      scheduled_time: ride.pickup_time,
      status: ride.status,
      driver: ride.driver_id ? {
        first_name: "À définir",
        last_name: "",
        company_name: "",
        company_phone: "",
        employee_phone: "",
        employee_name: ""
      } : undefined
    })) : []

    return NextResponse.json({ rides })
  } catch (error) {
    console.error('Server error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
