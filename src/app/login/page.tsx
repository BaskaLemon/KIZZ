'use client';

import { Suspense, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button, Field, TextInput } from '@/components/ui';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useMounted } from '@/hooks/useMounted';
import { cx } from '@/lib/cx';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';

type Mode = 'signin' | 'signup';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user, ready, setSession } = useAuth();
  const { resolvedTheme } = useTheme();
  // resolvedTheme is unknown until mounted (next-themes reads localStorage
  // client-side) — default to the light logo so server and first client
  // render agree, then switch once we know the real theme.
  const mounted = useMounted();
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo2.png' : '/logo.png';

  const [mode, setMode] = useState<Mode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace('/');
  }, [ready, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { token, user: nextUser } =
        mode === 'signin'
          ? await api.login({ email, password })
          : await api.signup({ name, email, password });
      setSession(token, nextUser);
      router.push('/');
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Нэвтрэхэд алдаа гарлаа',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper-raised px-6 py-12">
      <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <img
          src={logoSrc}
          alt="KIZZ"
          className="mx-auto w-full max-w-[280px]"
        />

        <div className="mt-6">
          <div className="mb-8 flex gap-2 rounded-xl border border-line bg-paper p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={cx(
                'flex-1 rounded-lg py-2 text-[15px] font-semibold transition-colors',
                mode === 'signin'
                  ? 'bg-violet text-white'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              Нэвтрэх
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={cx(
                'flex-1 rounded-lg py-2 text-[15px] font-semibold transition-colors',
                mode === 'signup'
                  ? 'bg-violet text-white'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              Бүртгүүлэх
            </button>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            {mode === 'signin' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {mode === 'signin'
              ? 'Дахин тавтай морил! Үргэлжлүүлэхийн тулд нэвтэрнэ үү.'
              : 'Шинэ бүртгэл үүсгээд KIZZ-ээр хамтдаа судлаарай.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-7">
            {mode === 'signup' && (
              <Field label="Нэр">
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Имэйл">
              <TextInput
                type="email"
                placeholder="Имэйл хаягаа оруулна уу"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Нууц үг">
              <TextInput
                type="password"
                placeholder="Нууц үг"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              className="mt-3"
              disabled={submitting}
            >
              {submitting
                ? 'Түр хүлээнэ үү...'
                : mode === 'signin'
                  ? "Let's Go"
                  : 'Бүртгүүлэх'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            {mode === 'signin' ? (
              <>
                Бүртгэлгүй байна уу?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-semibold text-violet hover:underline"
                >
                  Бүртгүүлэх
                </button>
              </>
            ) : (
              <>
                Бүртгэлтэй юу?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-semibold text-violet hover:underline"
                >
                  Нэвтрэх
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen fullScreen />}>
      <LoginForm />
    </Suspense>
  );
}
