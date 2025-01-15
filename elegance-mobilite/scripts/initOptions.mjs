import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const defaultOptions = [
  {
    name: 'child_seat',
    rate: 5.00
  },
  {
    name: 'pet',
    rate: 3.00
  },
  {
    name: 'airport',
    rate: 10.00
  }
]

async function initOptions() {
  try {
    console.log('Connecting to Supabase...')
    console.log('Supabase URL:', supabaseUrl)
    
    // Clear existing options
    console.log('Clearing existing options...')
    const deleteResult = await supabase.from('options').delete().neq('id', '')
    console.log('Delete result:', deleteResult)

    // Insert default options
    console.log('Inserting default options...')
    const { data, error } = await supabase
      .from('options')
      .insert(defaultOptions)
      .select()

    if (error) throw error

    console.log('Default options initialized successfully:')
    console.log(data)
  } catch (error) {
    console.error('Error initializing options:')
    console.error('Full error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status
    })
  }
}

initOptions()
