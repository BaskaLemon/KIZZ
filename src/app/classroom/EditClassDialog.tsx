'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Field, TextInput } from '@/components/ui';
import { ColorPicker } from '@/components/ColorPicker';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { isClassColorKey, type ClassColorKey } from '@/lib/classColor';
import type { ApiError, Class, ClassGroup } from '@/lib/types';

const NO_FOLDER = '';

interface Draft {
  name: string;
  section: string;
  level: string;
  subject: string;
  room: string;
  color: ClassColorKey;
  groupId: string;
}

function toDraft(klass: Class): Draft {
  return {
    name: klass.name,
    section: klass.section ?? '',
    level: klass.level ?? '',
    subject: klass.subject ?? '',
    room: klass.room ?? '',
    color: isClassColorKey(klass.color) ? klass.color : 'blue',
    groupId: klass.groupId ?? NO_FOLDER,
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
  const [folders, setFolders] = useState<ClassGroup[]>([]);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (open) setDraft(toDraft(klass));
  }, [open, klass]);

  useEffect(() => {
    if (open) {
      api
        .listClassGroups()
        .then(setFolders)
        .catch(() => setFolders([]));
    }
  }, [open]);

  if (!open) return null;

  async function createFolder() {
    if (!newFolderName.trim()) return;
    try {
      const folder = await api.createClassGroup(newFolderName.trim());
      setFolders((prev) => [...prev, folder]);
      setDraft((d) => ({ ...d, groupId: folder.id }));
      setNewFolderName('');
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Хавтас үүсгэхэд алдаа гарлаа', 'error');
    }
  }

  async function save() {
    if (!draft.name.trim()) {
      toast('Ангийн нэрээ оруулна уу', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateClass(klass.id, {
        name: draft.name.trim(),
        color: draft.color,
        section: draft.section.trim() || null,
        level: draft.level.trim() || null,
        subject: draft.subject.trim() || null,
        room: draft.room.trim() || null,
        groupId: draft.groupId || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-ink bg-paper-raised p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">Ангийг тохируулах</h2>
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
          <Field label="Ангийн нэр*">
            <TextInput
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="ж: 10А анги — Биологи"
            />
          </Field>
          <Field label="Бүлэг (Section)">
            <TextInput
              value={draft.section}
              onChange={(e) => setDraft({ ...draft, section: e.target.value })}
            />
          </Field>
          <Field label="Түвшин (Level)">
            <TextInput
              value={draft.level}
              onChange={(e) => setDraft({ ...draft, level: e.target.value })}
            />
          </Field>
          <Field label="Хичээл (Subject)">
            <TextInput
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            />
          </Field>
          <Field label="Өрөө (Room)">
            <TextInput
              value={draft.room}
              onChange={(e) => setDraft({ ...draft, room: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Хавтас (ангиудаа бүлэглэх)">
          <div className="flex flex-wrap gap-2">
            <select
              className="flex-1 rounded-sm border-2 border-line p-2.5"
              value={draft.groupId}
              onChange={(e) => setDraft({ ...draft, groupId: e.target.value })}
            >
              <option value={NO_FOLDER}>Хавтасгүй</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <TextInput
              className="flex-1"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              placeholder="Шинэ хавтасны нэр"
            />
            <button
              type="button"
              onClick={createFolder}
              className="rounded-sm border-2 border-line px-3 py-2.5 text-[13px] font-semibold text-ink hover:border-ink"
            >
              Нэмэх
            </button>
          </div>
        </Field>

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
      </div>
    </div>
  );
}
