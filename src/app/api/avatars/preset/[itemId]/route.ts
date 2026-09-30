import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { shopItems } from '@/db/schema';
import { renderPresetAvatar } from '@/lib/avatarPreset';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ itemId: string }> };

/** Public SVG of a shop avatar preset for a given seed (usually a user id).
 * Deterministic, so it is cached hard by browsers and CDNs. */
export async function GET(request: Request, { params }: Params) {
  const { itemId } = await params;
  if (!isUuid(itemId)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }
  const seed = (new URL(request.url).searchParams.get('seed') ?? itemId).slice(0, 64);

  const [item] = await getDb()
    .select({ value: shopItems.value, category: shopItems.category })
    .from(shopItems)
    .where(eq(shopItems.id, itemId))
    .limit(1);
  const svg = item?.category === 'avatarPreset' ? renderPresetAvatar(item.value, seed) : null;
  if (!svg) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
