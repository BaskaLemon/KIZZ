'use client';

/** Last-resort boundary for errors in the root layout itself (no app CSS or
 * providers are available here, so it is self-contained). */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="mn">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          fontFamily: 'system-ui, sans-serif',
          background: '#fbf3ec',
          color: '#151220',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>Алдаа гарлаа</h1>
        <p style={{ margin: 0, color: '#6b6458' }}>Хуудсыг дахин ачаалж үзнэ үү.</p>
        <button
          onClick={reset}
          style={{ marginTop: 8, padding: '10px 20px', border: 0, borderRadius: 12, background: '#c2570a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          Дахин оролдох
        </button>
      </body>
    </html>
  );
}
