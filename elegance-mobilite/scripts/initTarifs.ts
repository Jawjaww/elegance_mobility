const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const defaultRates = [
  {
    type: 'STANDARD',
    heureCreuse: 1.50,
    heurePleine: 2.00,
    nuit: 2.50
  },
  {
    type: 'PREMIUM',
    heureCreuse: 2.50,
    heurePleine: 3.00,
    nuit: 3.50
  },
  {
    type: 'VIP',
    heureCreuse: 4.00,
    heurePleine: 5.00,
    nuit: 6.00
  }
]

async function initRates() {
  try {
    // Clear existing rates
    await supabase.from('rates').delete().neq('id', '')

    // Insert default rates
    const { data, error } = await supabase
      .from('rates')
      .insert(defaultRates)
      .select()

    if (error) throw error

    console.log('Default rates initialized successfully:')
    console.log(data)
  } catch (error) {
    console.error('Error initializing rates:')
    console.error(error)
  }
}

initRates()
