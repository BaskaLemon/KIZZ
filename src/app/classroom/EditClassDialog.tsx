'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Field, TextInput } from '@/components/ui';
import { ColorPicker } from '@/components/ColorPicker';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { isClassColorKey, type ClassColorKey } from '@/lib/classColor';
import type { ApiError, Class } from '@/lib/types';
import { Modal } from '@/components/Modal';

interface Draft {
  name: string;
  description: string;
  color: ClassColorKey;
}

function toDraft(klass: Class): Draft {
  return {
    name: klass.name,
    description: klass.description ?? '',
    color: isClassColorKey(klass.color) ? klass.color : 'blue',
  };
}

export function EditClassDialog({
  open,
  klass,
  onClose,
  onSaved,
}: {
  open: boolean;
  klass: Class;
  onClose: () => void;
  onSaved: (klass: Class) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => toDraft(klass));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Re-seed the form each time the dialog opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setDraft(toDraft(klass));
  }, [open, klass]);

  if (!open) return null;

  async function save() {
    if (!draft.name.trim()) {
      toast('Бүлгийн нэрээ оруулна уу', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateClass(klass.id, {
        name: draft.name.trim(),
        color: draft.color,
        description: draft.description.trim() || null,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Хадгалахад алдаа гарлаа', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} label="Бүлгийг тохируулах">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">Бүлгийг тохируулах</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-1">
          <Field label="Бүлгийн нэр*">
            <TextInput
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="ж: Англи хэлний бүлэг"
            />
          </Field>
          <Field label="Тайлбар (заавал биш)">
            <textarea
              value={draft.description}
              maxLength={500}
              rows={3}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="ж: Даваа, Лхагва 19:00 — англи хэлний ярианы дадлага"
              className="w-full resize-y rounded-sm border-2 border-line bg-transparent p-2.5 text-[15px] text-ink outline-none focus:border-violet"
            />
          </Field>
        </div>

        <div className="mt-2">
          <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">
            Өнгө сонгох
          </p>
          <ColorPicker
            value={draft.color}
            onChange={(color) => setDraft({ ...draft, color })}
          />
        </div>

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            Цуцлах
          </button>
        </div>
    </Modal>
  );
}
