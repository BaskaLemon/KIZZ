import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './global.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { ConfirmProvider } from '@/lib/confirm';

// One rounded, friendly family for headings and body. `cyrillic` matters:
// without it Mongolian text silently falls back to the system font.
const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'KIZZ — Сур Сорь Тогло Хөгж',
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
