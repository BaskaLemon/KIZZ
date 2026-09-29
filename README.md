# kizz

Оюутан/багшийн study app: анги, даалгавар, тэмдэглэл (файл хавсралттай), quiz, live тоглоом, shop, streak.

Next.js 16 + Drizzle ORM + Postgres. Auth нь JWT (`jose`), нууц үг `bcryptjs`.

## Локал ажиллуулах

```bash
cp .env.local.example .env.local   # DATABASE_URL, AUTH_SECRET бөглөнө
bun install
bun run db:migrate                 # хүснэгтүүд үүсгэнэ
bun run db:seed                    # shop, streak, placement reward-ийн өгөгдөл (дахин ажиллуулахад аюулгүй)
bun run dev
```

## Scripts

| Script | Тайлбар |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` / `test` | Шалгалтууд |
| `db:generate` | Schema-с шинэ migration үүсгэнэ |
| `db:migrate` | Migration-уудыг DB-д хэрэглэнэ |
| `db:seed` | Анхны тохиргооны өгөгдөл оруулна |

## Deploy (Vercel + Supabase/Postgres)

1. Postgres үүсгээд connection string-ийг авна (Supabase бол transaction pooler; `prepare: false` тохируулагдсан).
2. Vercel дээр env оруулна: `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), заавал биш `GEMINI_API_KEY` (quiz-ийн AI горим).
3. Локалаас production DB рүү нэг удаа `bun run db:migrate && bun run db:seed` ажиллуулна.
4. Deploy хийнэ (`bun run build`).

## Тэмдэглэл

- Файлууд (ангийн материал, тэмдэглэлийн хавсралт) base64 хэлбэрээр Postgres-д хадгалагдана, файл бүр 3MB хүртэл (serverless request хязгаарт тааруулсан).
- Мэдэгдэл (шинэ даалгавар, материал, ангид нэгдсэн) апп дотор, 60 секунд тутам шинэчлэгдэнэ.
- Live тоглоом polling-оор ажиллана (custom socket server байхгүй тул Vercel дээр шууд ажиллана).
