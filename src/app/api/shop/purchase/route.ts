import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import {
  AlreadyOwnedError,
  InsufficientBalanceError,
  ItemNotFoundError,
  purchaseItem,
} from '@/lib/points/shop';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const itemId = typeof body?.itemId === 'string' ? body.itemId : '';
  if (!itemId) {
    return NextResponse.json({ error: 'itemId дутуу байна.' }, { status: 400 });
  }

  try {
    const result = await purchaseItem(user.id, itemId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ItemNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof AlreadyOwnedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    throw err;
  }
}
