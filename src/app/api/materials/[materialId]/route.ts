import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classMaterials } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';

type Params = { params: Promise<{ materialId: string }> };

/** RFC 5987 filename param so non-ASCII (Cyrillic) file names still work —
 * the plain `filename=` fallback strips anything a strict client couldn't
 * render, `filename*=` is what modern browsers actually use. */
function contentDisposition(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, '_') || 'file';
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { materialId } = await params;

  const [material] = await getDb()
    .select()
    .from(classMaterials)
    .where(eq(classMaterials.id, materialId))
    .limit(1);
  if (!material) {
    return NextResponse.json({ error: 'Файл олдсонгүй.' }, { status: 404 });
  }

  const { isMember } = await getClassMembership(
    material.classId,
    auth.user.id,
  );
  if (!isMember) {
    return NextResponse.json({ error: 'Файл олдсонгүй.' }, { status: 404 });
  }

  const buffer = Buffer.from(material.data, 'base64');
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': material.mimeType,
      'Content-Disposition': contentDisposition(material.fileName),
      'Content-Length': String(buffer.byteLength),
    },
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { materialId } = await params;

  const [material] = await getDb()
    .select({ id: classMaterials.id, classId: classMaterials.classId })
    .from(classMaterials)
    .where(eq(classMaterials.id, materialId))
    .limit(1);
  if (!material) {
    return NextResponse.json({ error: 'Файл олдсонгүй.' }, { status: 404 });
  }

  const { isTeacher } = await getClassMembership(
    material.classId,
    auth.user.id,
  );
  if (!isTeacher) {
    return NextResponse.json(
      { error: 'Зөвхөн ангийн багш файл устгах боломжтой.' },
      { status: 403 },
    );
  }

  await getDb().delete(classMaterials).where(eq(classMaterials.id, materialId));
  return NextResponse.json({ ok: true });
}
