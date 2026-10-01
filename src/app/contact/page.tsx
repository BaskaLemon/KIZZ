import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Холбоо барих',
  description: 'KIZZ-тэй холбогдох: асуулт, санал, алдааны мэдээлэл.',
};

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <LegalPage title="Холбоо барих">
      <section>
        <h2>Бидэнтэй холбогдох</h2>
        <p>
          Асуулт, санал, алдааны мэдээлэл байвал бидэнд бичээрэй. Бид аль болох хурдан хариулахыг хичээнэ.
        </p>
        {email ? (
          <p className="mt-3">
            Имэйл:{' '}
            <a className="font-semibold text-violet underline" href={`mailto:${email}`}>
              {email}
            </a>
          </p>
        ) : (
          <p className="mt-3 text-ink-soft">Холбоо барих имэйл хаяг удахгүй нэмэгдэнэ.</p>
        )}
      </section>
      <section>
        <h2>Юуны тухай бичиж болох вэ</h2>
        <ul>
          <li>Алдаа, ажиллахгүй байгаа зүйлийн тухай (аль хуудас, юу хийснээ бичвэл хурдан засна).</li>
          <li>Шинэ санаа, сайжруулах санал.</li>
          <li>Бүртгэл, өгөгдөлтэй холбоотой асуулт. Бүртгэлээ профайл хуудсаасаа өөрөө устгаж болно.</li>
        </ul>
      </section>
    </LegalPage>
  );
}
