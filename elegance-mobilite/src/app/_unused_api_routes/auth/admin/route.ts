import { NextResponse } from 'next/server';

export const dynamic = 'error'; // Exclude from static export (incompatible with Tauri)

export async function GET() {
  return NextResponse.json({ message: 'Admin endpoint' });
}
