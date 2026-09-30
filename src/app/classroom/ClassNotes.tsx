'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, SkeletonList, TextInput } from '@/components/ui';
import { NoteEditor, type SaveStatus } from '@/components/NoteEditor';
import { QuizGenButton } from '@/components/QuizGenButton';
import { NoteAttachments } from '@/components/NoteAttachments';
import { UserAvatarList, type Collaborator } from '@/components/UserAvatarList';
import { api } from '@/lib/api';
import { refreshNotifications } from '@/lib/events';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/lib/confirm';
import type { ApiError, ClassPeople, Note, User } from '@/lib/types';

const AUTOSAVE_DELAY = 900;

function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'дөнгөж сая';
  if (minutes < 60) return `${minutes} мин өмнө`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} цаг өмнө`;
  return `${Math.round(hours / 24)} өдрийн өмнө`;
}

/** Notes workspace. With a `classId` it shows that class's shared notes;
 * without one it shows the user's personal (private) notes. */
export function ClassNotes({
  classId,
  currentUser,
}: {
  classId?: string;
  currentUser: User;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [people, setPeople] = useState<ClassPeople | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title: '', content: '' });
  // updatedAt of the version our edits are based on (for conflict detection).
  const baseUpdatedAt = useRef<string | undefined>(undefined);

  useEffect(() => {
    (classId ? api.listClassNotes(classId) : api.listMyNotes())
      .then(setNotes)
      .catch((err: ApiError) => {
        toast(err.payload?.error || 'Тэмдэглэлүүдийг ачаалж чадсангүй', 'error');
        setNotes([]);
      });
    if (classId) {
      api
        .getPeople(classId)
        .then(setPeople)
        .catch(() => setPeople(null));
    }
  }, [classId, toast]);

  useEffect(() => {
    if (!activeNoteId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    let cancelled = false;
    api
      .getNote(activeNoteId)
      .then((note) => {
        if (cancelled) return;
        setActiveNote(note);
        setTitle(note.title);
        setContent(note.content);
        setStatus('saved');
        latest.current = { title: note.title, content: note.content };
        baseUpdatedAt.current = note.updatedAt;
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        toast(err.payload?.error || 'Тэмдэглэл олдсонгүй', 'error');
        setActiveNoteId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeNoteId, toast]);

  function scheduleSave(noteId: string, nextTitle: string, nextContent: string) {
    latest.current = { title: nextTitle, content: nextContent };
    setStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const saved = await api.updateNote(noteId, {
          ...latest.current,
          baseUpdatedAt: baseUpdatedAt.current,
        });
        baseUpdatedAt.current = saved.updatedAt;
        setStatus('saved');
        setActiveNote(saved);
        setNotes((prev) =>
          prev
            ? [saved, ...prev.filter((n) => n.id !== saved.id)]
            : prev,
        );
      } catch (err) {
        const apiErr = err as ApiError;
        const latestNote = (apiErr.payload as { latest?: Note } | undefined)?.latest;
        if (apiErr.status === 409 && latestNote) {
          // Someone else saved first — show their version instead of
          // overwriting it.
          baseUpdatedAt.current = latestNote.updatedAt;
          latest.current = { title: latestNote.title, content: latestNote.content };
          setActiveNote(latestNote);
          setTitle(latestNote.title);
          setContent(latestNote.content);
          setStatus('saved');
          toast(
            `${latestNote.updatedByName || 'Өөр хэн нэгэн'} тэмдэглэлийг өөрчилсөн тул шинэ хувилбарыг харууллаа`,
            'error',
          );
        } else {
          setStatus('error');
        }
      }
    }, AUTOSAVE_DELAY);
  }

  function handleTitleChange(next: string) {
    setTitle(next);
    if (activeNoteId) scheduleSave(activeNoteId, next, content);
  }

  function handleContentChange(next: string) {
    setContent(next);
    if (activeNoteId) scheduleSave(activeNoteId, title, next);
  }

  async function deleteActiveNote() {
    if (!activeNoteId) return;
    if (!(await confirm({ message: `"${title || 'Тэмдэглэл'}" тэмдэглэлийг устгах уу? Үүнийг буцаах боломжгүй.`, danger: true }))) return;
    try {
      await api.deleteNote(activeNoteId);
      const removed = activeNoteId;
      goBack();
      setNotes((prev) => (prev ? prev.filter((n) => n.id !== removed) : prev));
      toast('Тэмдэглэл устгагдлаа');
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Устгахад алдаа гарлаа', 'error');
    }
  }

  function goBack() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setActiveNoteId(null);
    setActiveNote(null);
  }

  async function createNote() {
    if (!newTitle.trim()) {
      toast('Тэмдэглэлийн гарчиг оруулна уу', 'error');
      return;
    }
    setCreating(true);
    try {
      const note = classId
        ? await api.createClassNote(classId, newTitle.trim())
        : await api.createMyNote(newTitle.trim());
      setNewTitle('');
      if (note.reward) toast(`🎉 Анхны тэмдэглэл! +${note.reward.xp} XP`);
      refreshNotifications();
      setNotes((prev) => (prev ? [note, ...prev] : [note]));
      setActiveNoteId(note.id);
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Алдаа гарлаа', 'error');
    } finally {
      setCreating(false);
    }
  }

  const collaborators: Collaborator[] = people
    ? [...people.teachers, ...people.students].filter((p) => p.id)
    : [];

  if (activeNoteId && activeNote) {
    const editorName =
      activeNote.updatedByName === currentUser.name
        ? 'Та'
        : activeNote.updatedByName;
    const lastEditedLabel = editorName
      ? `${editorName} ${relativeTime(activeNote.updatedAt)} засварласан`
      : undefined;

    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex w-fit items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={15} /> Бүх тэмдэглэл
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
          <NoteEditor
            title={title}
            content={content}
            collaborators={collaborators}
            status={status}
            lastEditedLabel={lastEditedLabel}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
          />

          <div className="flex flex-col gap-5">
            {classId && (
              <Card className="rounded-lg">
                <p className="text-sm font-medium text-ink-soft">
                  Бүлгийн гишүүд
                </p>
                <div className="mt-3">
                  <UserAvatarList collaborators={collaborators} showNames />
                </div>
              </Card>
            )}

            <Card className="rounded-lg">
              <p className="text-sm font-medium text-ink-soft">
                Тэмдэглэлээс quiz үүсгэх
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Тэмдэглэлийн агуулгаас AI олон сонголттой асуулт
                үүсгэнэ.
              </p>
              <div className="mt-4">
                <QuizGenButton noteId={activeNote.id} noteTitle={title} />
              </div>
            </Card>

            <Card className="rounded-lg">
              <p className="text-sm font-medium text-ink-soft">Хавсралт</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                PDF болон зураг хавсаргаж, тэмдэглэлээ баяжуулаарай.
              </p>
              <div className="mt-4">
                <NoteAttachments noteId={activeNote.id} />
              </div>
            </Card>

            <button
              type="button"
              onClick={deleteActiveNote}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-coral/40 px-4 py-2 text-[13px] font-semibold text-coral transition-colors hover:bg-coral/10"
            >
              <Trash2 size={14} /> Тэмдэглэл устгах
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-5 flex flex-col gap-3 rounded-lg">
        <h3 className="text-[17px]">Шинэ тэмдэглэл</h3>
        <div className="flex flex-wrap gap-3">
          <TextInput
            className="flex-1"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createNote()}
            placeholder="ж: 3-р бүлэг — Товч агуулга"
          />
          <Button variant="primary" onClick={createNote} disabled={creating}>
            {creating ? 'Нэмж байна...' : 'Үүсгэх'}
          </Button>
        </div>
      </Card>

      <h3 className="mb-2.5 text-lg">Тэмдэглэлүүд</h3>
      {notes !== null && notes.length > 4 && (
        <TextInput
          className="mb-3"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Тэмдэглэл хайх..."
          aria-label="Тэмдэглэл хайх"
        />
      )}
      {notes === null ? (
        <SkeletonList />
      ) : notes.length === 0 ? (
        <EmptyState title="Тэмдэглэл алга">
          <p>
            {classId
              ? 'Дээрх товчоор бүлгийн анхны хамтын тэмдэглэлээ үүсгээрэй.'
              : 'Дээрх товчоор анхны тэмдэглэлээ үүсгээрэй. Зөвхөн та харна.'}
          </p>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {notes
            .filter((n) => n.title.toLowerCase().includes(query.trim().toLowerCase()))
            .map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setActiveNoteId(note.id)}
              className="flex items-center gap-3.5 rounded-lg border border-line bg-paper-raised p-4 text-left shadow-sm transition-colors hover:border-violet/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet/15 text-violet">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base text-ink">{note.title}</h3>
                <p className="text-[13px] text-ink-soft">
                  {note.updatedByName ? `${note.updatedByName} · ` : ''}
                  {relativeTime(note.updatedAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
