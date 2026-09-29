'use client';

import { useEffect, useState } from 'react';
import { Shuffle, X } from 'lucide-react';
import {
  ACCESSORIES,
  AvatarOptions,
  BACKGROUND_COLORS,
  EYE_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTH_STYLES,
  NO_ACCESSORY,
  SKIN_COLORS,
  generateAvatarUri,
  randomAvatarOptions,
} from '../lib/avatar';

function accessoryLabel(value: string) {
  return value === NO_ACCESSORY ? 'Байхгүй' : value;
}

interface AvatarCustomizerProps {
  open: boolean;
  initial: AvatarOptions;
  saving?: boolean;
  onClose: () => void;
  onSave: (options: AvatarOptions) => void;
}

function OptionPills({
  label,
  options,
  value,
  onChange,
  getLabel = (option) => option,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  getLabel?: (option: string) => string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              value === option
                ? 'border-transparent bg-ink text-paper'
                : 'border-line bg-paper-raised text-ink hover:border-ink/30'
            }`}
          >
            {getLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorSwatches({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            onClick={() => onChange(color)}
            style={{ backgroundColor: `#${color}` }}
            className={`h-8 w-8 rounded-full border-2 transition-transform ${
              value === color ? 'scale-110 border-ink' : 'border-line hover:scale-105'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function AvatarCustomizer({
  open,
  initial,
  saving,
  onClose,
  onSave,
}: AvatarCustomizerProps) {
  const [draft, setDraft] = useState<AvatarOptions>(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-paper-raised p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">Аватар тохируулах</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <img
            src={generateAvatarUri(draft)}
            alt="Аватарын урьдчилсан харагдац"
            className="h-28 w-28 rounded-full border border-line"
          />
          <button
            type="button"
            onClick={() => setDraft(randomAvatarOptions())}
            className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
          >
            <Shuffle size={15} /> Санамсаргүй
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <OptionPills
            label="Үсний загвар"
            options={HAIR_STYLES}
            value={draft.hair}
            onChange={(hair) => setDraft({ ...draft, hair })}
          />
          <ColorSwatches
            label="Үсний өнгө"
            colors={HAIR_COLORS}
            value={draft.hairColor}
            onChange={(hairColor) => setDraft({ ...draft, hairColor })}
          />
          <OptionPills
            label="Ам"
            options={MOUTH_STYLES}
            value={draft.mouth}
            onChange={(mouth) => setDraft({ ...draft, mouth })}
          />
          <OptionPills
            label="Нүд"
            options={EYE_STYLES}
            value={draft.eyes}
            onChange={(eyes) => setDraft({ ...draft, eyes })}
          />
          <ColorSwatches
            label="Арьсны өнгө"
            colors={SKIN_COLORS}
            value={draft.skinColor}
            onChange={(skinColor) => setDraft({ ...draft, skinColor })}
          />
          <ColorSwatches
            label="Дэвсгэр өнгө"
            colors={BACKGROUND_COLORS}
            value={draft.backgroundColor}
            onChange={(backgroundColor) =>
              setDraft({ ...draft, backgroundColor })
            }
          />
          <OptionPills
            label="Аксессуар"
            options={ACCESSORIES}
            value={draft.accessory}
            onChange={(accessory) => setDraft({ ...draft, accessory })}
            getLabel={accessoryLabel}
          />
        </div>

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={saving}
            className="rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Цуцлах
          </button>
        </div>
      </div>
    </div>
  );
}
