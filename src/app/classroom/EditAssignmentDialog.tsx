'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Field, TextInput } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { ApiError, Assignment } from '@/lib/types';

/** `YYYY-MM-DD` of a stored due date, as Ulaanbaatar sees it. */
function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Ulaanbaatar' });
}

export function EditAssignmentDialog({
  assignment,
  onClose,
  onSaved,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState(assignment.title);
  const [dueAt, setDueAt] = useState(toDateInput(assignment.dueAt));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return toast('Даалгаврын нэрийг оруулна уу', 'error');
    setSaving(true);
    try {
      await api.updateAssignment(assignment.id, { title: title.trim(), dueAt: dueAt || null });
      toast('Даалгавар шинэчлэгдлээ');
      onSaved();
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Хадгалахад алдаа гарлаа', 'error');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-paper-raised p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">Даалгавар засах</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          >
            <X size={18} />
          </button>
        </div>
        <Field label="Нэр*" className="mt-4">
          <TextInput autoFocus value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Хугацаа (заавал биш)">
          <input
            type="date"
            className="w-full rounded-sm border-2 border-line p-2.5"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </Field>
        <p className="text-xs text-ink-soft">
          Хугацааг өөрчилвөл гишүүдэд мэдэгдэл очно.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Болих
          </Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </div>
      </div>
    </div>
  );
}
