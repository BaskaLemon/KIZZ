'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, TextInput } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/lib/confirm';
import type { ApiError } from '@/lib/types';

/** Name change, password change and account deletion. */
export function AccountSettings() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  const errorOf = (err: unknown, fallback: string) =>
    (err as ApiError).payload?.error || fallback;

  async function saveName() {
    setSavingName(true);
    try {
      const next = await api.updateProfile({ name });
      updateUser({ name: next.name });
      toast('Нэр шинэчлэгдлээ');
    } catch (err) {
      toast(errorOf(err, 'Алдаа гарлаа'), 'error');
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword() {
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      toast('Нууц үг солигдлоо');
    } catch (err) {
      toast(errorOf(err, 'Алдаа гарлаа'), 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteAccount() {
    if (!(await confirm({ message: 'Бүртгэлээ бүрмөсөн устгах уу? Таны бүх тэмдэглэл, quiz, таны үүсгэсэн бүлгүүд устна. Үүнийг буцаах боломжгүй.', danger: true, confirmLabel: 'Бүртгэл устгах' }))) return;
    setDeleteBusy(true);
    try {
      await api.deleteAccount(deletePassword);
      logout();
      router.push('/');
    } catch (err) {
      toast(errorOf(err, 'Алдаа гарлаа'), 'error');
      setDeleteBusy(false);
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="text-lg font-bold text-ink">Бүртгэлийн тохиргоо</h2>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <Field label="Нэр" className="mb-0 min-w-56 flex-1">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </Field>
        <Button
          variant="primary"
          onClick={saveName}
          disabled={savingName || !name.trim() || name.trim() === user?.name}
        >
          Хадгалах
        </Button>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={user?.showOnLeaderboard ?? true}
            onChange={async (e) => {
              const next = e.target.checked;
              try {
                const updated = await api.updateProfile({ showOnLeaderboard: next });
                updateUser({ showOnLeaderboard: updated.showOnLeaderboard });
                toast(next ? 'Жагсаалтад харагдана' : 'Жагсаалтаас нуулаа');
              } catch (err) {
                toast(errorOf(err, 'Алдаа гарлаа'), 'error');
              }
            }}
            className="mt-1 h-4 w-4 accent-violet"
          />
          <span>
            <span className="block text-base font-bold text-ink">Тэргүүлэгчдийн жагсаалтад харагдах</span>
            <span className="block text-sm text-ink-soft">
              Унтраавал таны нэр нийтийн XP жагсаалтад гарахгүй (бүлгийн доторх жагсаалтад гишүүд харна).
            </span>
          </span>
        </label>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-base font-bold text-ink">Нууц үг солих</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <Field label="Одоогийн нууц үг" className="mb-0">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="Шинэ нууц үг (6+ тэмдэгт)" className="mb-0">
            <TextInput
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
        </div>
        <Button
          variant="primary"
          className="mt-3"
          onClick={savePassword}
          disabled={savingPassword || !currentPassword || newPassword.length < 6}
        >
          Нууц үг солих
        </Button>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-base font-bold text-coral">Бүртгэл устгах</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Бүх өгөгдөл бүрмөсөн устана. Буцаах боломжгүй.
        </p>
        {deleting ? (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Нууц үгээ баталгаажуулна уу" className="mb-0 min-w-56 flex-1">
              <TextInput
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </Field>
            <Button
              variant="ghost"
              className="border-coral text-coral"
              onClick={deleteAccount}
              disabled={deleteBusy || !deletePassword}
            >
              Устгах
            </Button>
            <Button variant="ghost" onClick={() => setDeleting(false)}>
              Болих
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="mt-3 border-coral text-coral" onClick={() => setDeleting(true)}>
            Бүртгэл устгах
          </Button>
        )}
      </div>
    </Card>
  );
}
