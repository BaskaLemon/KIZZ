'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button, Card, EmptyState, TextInput } from '@/components/ui';
import { NoteEditor, type SaveStatus } from '@/components/NoteEditor';
import { QuizGenButton } from '@/components/QuizGenButton';
import { MediaUploaderPlaceholder } from '@/components/MediaUploaderPlaceholder';
import { UserAvatarList, type Collaborator } from '@/components/UserAvatarList';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
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

export function ClassNotes({
  classId,
  currentUser,
}: {
  classId: string;
  currentUser: User;
}) {
  const toast = useToast();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [people, setPeople] = useState<ClassPeople | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title: '', content: '' });

  useEffect(() => {
    api
      .listClassNotes(classId)
      .then(setNotes)
      .catch((err: ApiError) => {
        toast(err.payload?.error || 'Тэмдэглэлүүдийг ачаалж чадсангүй', 'error');
        setNotes([]);
      });
    api
      .getPeople(classId)
      .then(setPeople)
      .catch(() => setPeople(null));
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
        const saved = await api.updateNote(noteId, latest.current);
        setStatus('saved');
        setActiveNote(saved);
        setNotes((prev) =>
          prev
            ? [saved, ...prev.filter((n) => n.id !== saved.id)]
            : prev,
        );
      } catch {
        setStatus('error');
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
      const note = await api.createClassNote(classId, newTitle.trim());
      setNewTitle('');
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
            <Card className="rounded-lg">
              <p className="text-sm font-medium text-ink-soft">
                Ангийн гишүүд
              </p>
              <div className="mt-3">
                <UserAvatarList collaborators={collaborators} showNames />
              </div>
            </Card>

            <Card className="rounded-lg">
              <p className="text-sm font-medium text-ink-soft">
                Тэмдэглэлээс quiz үүсгэх
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Тэмдэглэлийн агуулгаас дүрэмт аргаар олон сонголттой асуулт
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
                <MediaUploaderPlaceholder />
              </div>
            </Card>
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
      {notes === null ? null : notes.length === 0 ? (
        <EmptyState title="Тэмдэглэл алга">
          <p>Дээрх товчоор ангийн анхны хамтын тэмдэглэлээ үүсгээрэй.</p>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
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
