import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './global.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { ConfirmProvider } from '@/lib/confirm';
import { SITE_URL } from '@/lib/site';

// One rounded, friendly family for headings and body. `cyrillic` matters:
// without it Mongolian text silently falls back to the system font.
const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
});

const DESCRIPTION =
  'Тэмдэглэлээ бич, нэг товшилтоор AI-аар quiz болго, найзуудтайгаа шууд тоглож өрсөлд. Сурагч, оюутан, ажилтан, бие даан сурч байгаа хэн бүхэнд.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'KIZZ — Сур Сорь Тогло Хөгж', template: '%s — KIZZ' },
  description: DESCRIPTION,
  applicationName: 'KIZZ',
  openGraph: {
    type: 'website',
    siteName: 'KIZZ',
    locale: 'mn_MN',
    title: 'KIZZ — Сур Сорь Тогло Хөгж',
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'KIZZ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KIZZ — Сур Сорь Тогло Хөгж',
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="mn"
      className={nunito.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint: if a session token exists, flag <html> so
            the server-rendered signed-out landing is swapped for the loading
            coin until React hydrates (see global.css). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('studyjam.token'))document.documentElement.dataset.auth='1'}catch(e){}",
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
