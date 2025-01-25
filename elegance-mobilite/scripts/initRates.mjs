import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const defaultRates = [
  {
    type: 'STANDARD',
    base_rate: 1.04,
    peak_rate: 1.22,
    night_rate: 1.24
  },
  {
    type: 'PREMIUM',
    base_rate: 1.20,
    peak_rate: 1.40,
    night_rate: 1.45
  },
  {
    type: 'VIP',
    base_rate: 1.70,
    peak_rate: 2.00,
    night_rate: 2.60
  }
]

async function initRates() {
  try {
    console.log('Connecting to Supabase...')
    console.log('Supabase URL:', supabaseUrl)
    
    // Clear existing rates
    console.log('Clearing existing rates...')
    const deleteResult = await supabase.from('rates').delete().neq('id', '')
    console.log('Delete result:', deleteResult)

    // Insert default rates
    console.log('Inserting default rates...')
    const { data, error } = await supabase
      .from('rates')
      .insert(defaultRates)
      .select()

    if (error) throw error

    console.log('Default rates initialized successfully:')
    console.log(data)
  } catch (error) {
    console.error('Error initializing rates:')
    console.error('Full error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status
    })
  }
}

initRates()
