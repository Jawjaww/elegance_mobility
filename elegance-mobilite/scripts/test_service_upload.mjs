import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || process.env.SUPABASE_PUBLIC_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment')
  process.exit(1)
}

const base = SUPABASE_URL.replace(/\/+$/g, '')
const admin = createClient(base, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function run() {
  const bucket = 'driver-documents'
  const path = `tmp/test_service_upload_${Date.now()}.png`
  // small 1x1 PNG
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='
  const buffer = Buffer.from(pngBase64, 'base64')
  try {
    console.log('Uploading to', path)
    const { data: uploadData, error: uploadErr } = await admin.storage.from(bucket).upload(path, buffer, { contentType: 'image/png', upsert: true })
    console.log('uploadErr:', uploadErr)
    console.log('uploadData:', uploadData)

    if (uploadErr) process.exit(2)

    console.log('Inserting record in driver_documents')
    const docType = 'driving_license'
    const { data: insertData, error: insertErr } = await admin.from('driver_documents').insert([{ driver_id: null, document_type: docType, file_url: uploadData.path, file_name: path.split('/').pop(), file_size: buffer.length, upload_date: new Date().toISOString(), validation_status: 'pending_temp' }]).select().maybeSingle()
    console.log('insertErr:', insertErr)
    console.log('insertData:', insertData)

    if (insertErr) {
      console.error('Insert failed; cleaning up uploaded object...')
      await admin.storage.from(bucket).remove([uploadData.path]).catch(() => null)
      process.exit(3)
    }

    // create signed URL to verify
    const { data: signed, error: signedErr } = await admin.storage.from(bucket).createSignedUrl(uploadData.path, 60 * 60)
    console.log('signedErr:', signedErr)
    console.log('signed:', signed)

    console.log('SUCCESS')
  } catch (e) {
    console.error('Unexpected error', e)
    process.exit(99)
  }
}

run()
