import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import Link from 'next/link';
import { cx } from '@/lib/cx';

export function BrandMark({
  className,
  size = 'default',
  border = 'ink',
}: {
  className?: string;
  size?: 'default' | 'lg';
  border?: 'ink' | 'stage-text';
}) {
  return (
    <span
      className={cx(
        'inline-block rounded-lg border bg-violet',
        border === 'ink' ? 'border-ink/15' : 'border-stage-text/30',
        size === 'lg' ? 'h-10 w-10' : 'h-8.5 w-8.5',
        className,
      )}
    />
  );
}

type ButtonVariant = 'default' | 'primary' | 'mint' | 'ghost';
type ButtonSize = 'default' | 'lg';

export function buttonClasses(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  stage?: boolean;
}) {
  const {
    variant = 'default',
    size = 'default',
    block,
    className,
    stage,
  } = opts;
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 no-underline',
    size === 'lg' ? 'px-7 py-3.5 text-[16px]' : 'px-5 py-2.5 text-[14px]',
    block && 'w-full',
    variant === 'primary' &&
      'border-transparent bg-violet text-white shadow-sm hover:shadow-md hover:brightness-110',
    variant === 'mint' &&
      'border-transparent bg-mint text-white shadow-sm hover:shadow-md hover:brightness-110',
    variant === 'ghost' &&
      cx(
        'border-transparent',
        stage ? 'text-stage-text hover:bg-white/5' : 'text-ink hover:bg-ink/5',
      ),
    variant === 'default' &&
      'border-line bg-paper-raised text-ink hover:border-ink/25 hover:bg-paper',
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  stage?: boolean;
}

export function Button({
  variant,
  size,
  block,
  stage,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, block, stage, className })}
      {...rest}
    />
  );
}

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}

export function LinkButton({
  href,
  children,
  variant,
  size,
  block,
  className,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={buttonClasses({ variant, size, block, className })}
    >
      {children}
    </Link>
  );
}

export function Card({
  className,
  children,
  stage,
}: {
  className?: string;
  children: ReactNode;
  stage?: boolean;
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border p-5',
        stage
          ? 'border-white/10 bg-stage-raised text-stage-text'
          : 'border-line bg-paper-raised shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('mb-3 flex flex-col gap-1.5', className)}>
      <label className="text-[13px] font-semibold text-ink-soft">{label}</label>
      {children}
    </div>
  );
}

export function TextInput({
  className,
  stage,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { stage?: boolean }) {
  return (
    <input
      className={cx(
        'rounded-lg border px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/15',
        stage
          ? 'border-stage-text-soft bg-stage text-stage-text placeholder:text-stage-text-soft'
          : 'border-line bg-paper text-ink',
        className,
      )}
      {...rest}
    />
  );
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        'rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/15',
        className,
      )}
      {...rest}
    />
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <Card className="px-5 py-12 text-center text-ink-soft">
      <h3 className="mb-2 text-ink">{title}</h3>
      {children}
    </Card>
  );
}
