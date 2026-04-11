#!/usr/bin/env node
// Create the private storage bucket `driver-documents` in a Supabase project
// Usage: SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=ey... node create_driver_documents_bucket.mjs

const BUCKET = 'driver-documents';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL in environment.');
  process.exit(1);
}

const base = SUPABASE_URL.replace(/\/$/, '');

async function bucketExists(name) {
  const url = `${base}/storage/v1/bucket/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
  });
  return res.ok;
}

async function createBucket(name) {
  const url = `${base}/storage/v1/bucket`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ name, public: false }),
  });

  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

(async function main() {
  try {
    console.log('Supabase URL:', base);
    console.log('Checking for bucket:', BUCKET);

    const exists = await bucketExists(BUCKET);
    if (exists) {
      console.log(`Bucket '${BUCKET}' already exists.`);
      process.exit(0);
    }

    console.log(`Bucket '${BUCKET}' not found. Creating...`);
    const res = await createBucket(BUCKET);
    if (res.ok) {
      console.log(`Bucket '${BUCKET}' created successfully.`);
      process.exit(0);
    } else {
      console.error('Failed to create bucket:', res.status, res.body);
      process.exit(2);
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(3);
  }
})();
