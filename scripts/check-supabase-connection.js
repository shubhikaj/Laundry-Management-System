// Simple Supabase connection check script
// Usage (PowerShell):
//  $env:NEXT_PUBLIC_SUPABASE_URL = "https://your-project-id.supabase.co";
//  $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key";
//  node .\scripts\check-supabase-connection.js

const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', url)
console.log('Has anon key:', !!key)

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  console.error('Set them in PowerShell:')
  console.error('  $env:NEXT_PUBLIC_SUPABASE_URL = "https://your-project-id.supabase.co"')
  console.error('  $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key"')
  process.exit(1)
}

const supabase = createClient(url, key)

async function run() {
  try {
    // Try a simple read from a common table
    const { data, error, status } = await supabase
      .from('laundry_schedules')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Supabase query error:', error)
      process.exit(1)
    }

    console.log('Query status:', status)
    console.log('Sample data:', data)

    // Try an insert into a lightweight test table (optional).
    // WARNING: Run only if you want to insert test row into your DB.
    // Uncomment the following block if you want to test writes.
    /*
    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert([{ user_id: 'script-test', batch_id: 'script-test', type: 'email', message: 'test', delivered: false }])
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      process.exit(1)
    }

    console.log('Insert result:', insertData)
    */

    console.log('Supabase connection test completed successfully.')
    process.exit(0)
  } catch (err) {
    console.error('Unexpected error during Supabase test:', err)
    process.exit(1)
  }
}

run()
