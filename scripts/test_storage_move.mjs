import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const bucket = 'driver-documents';
  const userId = `testuser_${Date.now()}`;
  const tmpPath = `tmp/${userId}/test_storage_move.txt`;
  const newPath = `${userId}/test_storage_move_moved.txt`;

  try {
    console.log('Uploading to', tmpPath);
    const content = 'storage-move-test-' + Date.now();
    const blob = new Blob([content], { type: 'text/plain' });

    const { data: uploadData, error: uploadErr } = await supabase.storage.from(bucket).upload(tmpPath, blob, { upsert: true });
    console.log('uploadErr:', uploadErr);
    console.log('uploadData:', uploadData);

    console.log('Attempting copy from', tmpPath, 'to', newPath);
    // Some versions of the client support copy
    const copyFn = supabase.storage.from(bucket).copy;
    if (typeof copyFn !== 'function') {
      console.log('copy function not available on storage client');
      return;
    }

    const { data: copyData, error: copyErr } = await supabase.storage.from(bucket).copy(tmpPath, newPath);
    console.log('copyErr:', copyErr);
    console.log('copyData:', copyData);

    console.log('Attempting remove of original', tmpPath);
    const { data: rmData, error: rmErr } = await supabase.storage.from(bucket).remove([tmpPath]);
    console.log('rmErr:', rmErr);
    console.log('rmData:', rmData);

    // Clean moved file
    console.log('Cleaning moved file', newPath);
    const { error: cleanupErr } = await supabase.storage.from(bucket).remove([newPath]);
    console.log('cleanupErr:', cleanupErr);
  } catch (e) {
    console.error('Unexpected error', e);
  }
}

run();
