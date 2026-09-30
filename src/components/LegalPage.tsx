import type { ReactNode } from 'react';
import { Shell, View } from '@/components/Shell';

/** Shared frame for the plain-language legal pages. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Shell activePath="">
      <View narrow>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">Сүүлд шинэчилсэн: {updated}</p>
        <div className="mt-6 flex flex-col gap-6 text-[15px] leading-relaxed text-ink [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
          {children}
        </div>
      </View>
    </Shell>
  );
}

/** Where users can reach the operator. Set NEXT_PUBLIC_CONTACT_EMAIL to show it. */
export function ContactLine() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <section>
      <h2>Холбоо барих</h2>
      <p>
        {email ? (
          <>
            Асуулт, хүсэлт, өгөгдлөө устгуулах тухай:{' '}
            <a className="font-semibold text-violet underline" href={`mailto:${email}`}>
              {email}
            </a>
          </>
        ) : (
          'Асуулт, хүсэлт байвал апп-ын администратортай холбогдоно уу.'
        )}
      </p>
    </section>
  );
}
