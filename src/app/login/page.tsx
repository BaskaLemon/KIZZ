'use client';

import { Suspense, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Field, TextInput } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cx } from '@/lib/cx';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';

type Mode = 'signin' | 'signup';

/** Both logo variants are in the HTML and CSS shows the one that matches the
 * theme class next-themes sets before first paint — no wrong logo, and no swap
 * after hydration. */
function LogoMark() {
  return (
    <>
      <img
        src="/logo.webp"
        alt="KIZZ"
        width={654}
        height={621}
        fetchPriority="high"
        className="mx-auto w-full max-w-[280px] dark:hidden"
      />
      <img
        src="/logo2.webp"
        alt="KIZZ"
        width={656}
        height={622}
        fetchPriority="high"
        className="mx-auto hidden w-full max-w-[280px] dark:block"
      />
    </>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user, ready, setSession } = useAuth();

  const [mode, setMode] = useState<Mode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        <LogoMark />

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
              <div className="relative">
                <TextInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Нууц үг"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pr-11"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Нууц үгийг нуух' : 'Нууц үгийг харуулах'}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
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
            {mode === 'signup' && (
              <p className="mt-3 text-center text-xs leading-relaxed text-ink-soft">
                Бүртгүүлснээр та{' '}
                <a href="/terms" target="_blank" className="font-semibold underline">
                  Үйлчилгээний нөхцөл
                </a>
                ,{' '}
                <a href="/privacy" target="_blank" className="font-semibold underline">
                  Нууцлалын бодлогыг
                </a>{' '}
                хүлээн зөвшөөрнө.
              </p>
            )}
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
    <Suspense
      fallback={
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper-raised px-6 py-12">
          <div className="w-full max-w-sm">
            <LogoMark />
            <div className="mt-6 h-[26rem]" aria-hidden />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
