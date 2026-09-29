import { NextResponse } from 'next/server';

// Tokens are stateless JWTs, so there is nothing to invalidate server-side —
// the client just discards its copy (see authStorage.clear()).
export async function POST() {
  return NextResponse.json({ ok: true });
}
