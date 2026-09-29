import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { loadGameState } from '@/lib/game';

type Params = { params: Promise<{ id: string }> };

// The poll target — clients hit this every ~1.5s while on the play screen.
export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;

  const state = await loadGameState(id, auth.user.id);
  if (!state) {
    return NextResponse.json({ error: 'Тоглоом олдсонгүй.' }, { status: 404 });
  }
  return NextResponse.json(state);
}
