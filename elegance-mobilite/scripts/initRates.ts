import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  try {
    // Check for existing rates
    const { data: existingRates } = await supabase
      .from('rates')
      .select('type')
    
    if (existingRates && existingRates.length > 0) {
      console.log('Rates already exist, skipping initialization')
      return
    }

    // Insert initial rates
    const { data, error } = await supabase.from('rates').insert([
      {
        type: 'STANDARD',
        base_rate: 50.0,
        peak_rate: 60.0,
        night_rate: 70.0
      },
      {
        type: 'PREMIUM',
        base_rate: 80.0,
        peak_rate: 90.0,
        night_rate: 100.0
      },
      {
        type: 'VIP',
        base_rate: 120.0,
        peak_rate: 130.0,
        night_rate: 140.0
      }
    ]).select()

    if (error) throw error

    console.log('Rates initialized successfully:')
    console.log(data)
  } catch (err) {
    console.error('Error initializing rates:')
    console.error(err)
    process.exit(1)
  }
}

main()
