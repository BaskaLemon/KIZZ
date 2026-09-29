import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classMaterials } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { toMaterial } from '@/lib/mappers';
import {
  insertMaterial,
  materialColumns,
  validateMaterialFile,
} from '@/lib/materials';

type Params = { params: Promise<{ classId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;

  const { klass, isMember } = await getClassMembership(classId, auth.user.id);
  if (!klass || !isMember) {
    return NextResponse.json({ error: 'Анги олдсонгүй.' }, { status: 404 });
  }

  const rows = await getDb()
    .select(materialColumns)
    .from(classMaterials)
    .where(eq(classMaterials.classId, classId))
    .orderBy(desc(classMaterials.createdAt));

  return NextResponse.json(rows.map(toMaterial));
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;

  const { klass, isTeacher } = await getClassMembership(classId, auth.user.id);
  if (!klass) {
    return NextResponse.json({ error: 'Анги олдсонгүй.' }, { status: 404 });
  }
  if (!isTeacher) {
    return NextResponse.json(
      { error: 'Зөвхөн ангийн багш файл байршуулах боломжтой.' },
      { status: 403 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  const invalid = validateMaterialFile(file);
  if (invalid) {
    return NextResponse.json({ error: invalid.error }, { status: invalid.status });
  }

  const row = await insertMaterial({
    classId,
    uploadedBy: auth.user.id,
    file: file as File,
  });
  return NextResponse.json(toMaterial(row), { status: 201 });
}
