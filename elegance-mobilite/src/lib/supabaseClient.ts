import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be defined in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Table Reservations Schema
export const createReservationsTable = async () => {
  const { data, error } = await supabase
    .from('reservations')
    .insert([
      {
        table_name: 'reservations',
        columns: [
          { name: 'id', type: 'uuid', primary_key: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'client_name', type: 'text', not_null: true },
          { name: 'client_email', type: 'text', not_null: true },
          { name: 'client_phone', type: 'text' },
          { name: 'pickup_date', type: 'date', not_null: true },
          { name: 'pickup_time', type: 'time', not_null: true },
          { name: 'pickup_address', type: 'text', not_null: true },
          { name: 'dropoff_address', type: 'text', not_null: true },
          { name: 'vehicle_type', type: 'text', not_null: true },
          { name: 'special_requests', type: 'text' },
          { name: 'status', type: 'text', default: "'pending'" }
        ]
      }
    ])

  if (error) {
    console.error('Error creating reservations table:', error)
    return null
  }

  return data
}