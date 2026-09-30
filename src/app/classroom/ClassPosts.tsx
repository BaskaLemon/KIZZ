'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Pin, PinOff, Trash2 } from 'lucide-react';
import { Button, Card, SkeletonList } from '@/components/ui';
import { api } from '@/lib/api';
import { avatarSrcFor } from '@/lib/avatar';
import { useConfirm } from '@/lib/confirm';
import { cx } from '@/lib/cx';
import { useToast } from '@/lib/toast';
import type { ApiError, ClassPost, PostAuthor } from '@/lib/types';

const MAX_POST = 2000;
const MAX_COMMENT = 1000;

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'дөнгөж сая';
  if (minutes < 60) return `${minutes} мин өмнө`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} цагийн өмнө`;
  return `${Math.round(hours / 24)} өдрийн өмнө`;
}

function Author({ author, when }: { author: PostAuthor; when: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={avatarSrcFor(author)} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink">{author.name}</p>
        <p className="text-xs text-ink-soft">{when}</p>
      </div>
    </div>
  );
}

function Composer({
  placeholder,
  max,
  submitLabel,
  onSubmit,
  compact = false,
}: {
  placeholder: string;
  max: number;
  submitLabel: string;
  onSubmit: (body: string) => Promise<void>;
  compact?: boolean;
}) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await onSubmit(body.trim());
      setBody('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={body}
        maxLength={max}
        rows={compact ? 2 : 3}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit();
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full resize-y rounded-lg border border-line bg-paper p-3 text-[15px] text-ink outline-none focus:border-violet focus:ring-2 focus:ring-violet/15"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-soft">
          {body.length} / {max}
        </span>
        <Button variant="primary" onClick={submit} disabled={busy || !body.trim()}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

/** Announcements from the group's admins, with member comments. */
export function ClassPosts({ classId, isAdmin }: { classId: string; isAdmin: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [posts, setPosts] = useState<ClassPost[] | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setPosts(await api.listPosts(classId));
    } catch {
      setPosts([]);
    }
  }, [classId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const fail = (err: unknown) =>
    toast((err as ApiError).payload?.error || 'Алдаа гарлаа', 'error');

  async function removePost(post: ClassPost) {
    if (!(await confirm({ message: 'Энэ зарлалыг устгах уу? Сэтгэгдлүүд нь хамт устна.', danger: true }))) return;
    try {
      await api.deletePost(post.id);
      await load();
    } catch (err) {
      fail(err);
    }
  }

  function toggleComments(id: string) {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section aria-label="Зарлал">
      <h3 className="mb-2.5 text-lg">Зарлал</h3>

      {isAdmin && (
        <Card className="mb-4 rounded-lg">
          <Composer
            placeholder="Бүлгийнхээ гишүүдэд зарлал бичих..."
            max={MAX_POST}
            submitLabel="Нийтлэх"
            onSubmit={async (body) => {
              try {
                setPosts(await api.createPost(classId, body));
              } catch (err) {
                fail(err);
                throw err;
              }
            }}
          />
        </Card>
      )}

      {posts === null ? (
        <SkeletonList rows={2} />
      ) : posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-5 text-center text-sm text-ink-soft">
          {isAdmin ? 'Анхны зарлалаа бичээрэй, гишүүдэд мэдэгдэл очно.' : 'Одоохондоо зарлал алга.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => {
            const open = openComments.has(post.id);
            return (
              <Card
                key={post.id}
                className={cx('rounded-lg', post.pinned && 'border-violet/50 bg-violet/5')}
              >
                <div className="flex items-start justify-between gap-3">
                  <Author author={post.author} when={timeAgo(post.createdAt)} />
                  <div className="flex shrink-0 items-center gap-1">
                    {post.pinned && (
                      <span className="mr-1 rounded-full bg-violet/15 px-2 py-0.5 text-[11px] font-semibold text-violet">
                        Бэхлэгдсэн
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          api
                            .pinPost(post.id, !post.pinned)
                            .then(load)
                            .catch(fail)
                        }
                        aria-label={post.pinned ? 'Бэхлэлтийг авах' : 'Бэхлэх'}
                        title={post.pinned ? 'Бэхлэлтийг авах' : 'Бэхлэх'}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink"
                      >
                        {post.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                      </button>
                    )}
                    {post.canDelete && (
                      <button
                        type="button"
                        onClick={() => removePost(post)}
                        aria-label="Зарлал устгах"
                        title="Устгах"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-coral/10 hover:text-coral"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink">
                  {post.body}
                </p>

                <button
                  type="button"
                  onClick={() => toggleComments(post.id)}
                  aria-expanded={open}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-ink"
                >
                  <MessageCircle size={15} aria-hidden />
                  {post.comments.length > 0 ? `${post.comments.length} сэтгэгдэл` : 'Сэтгэгдэл бичих'}
                </button>

                {open && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
                    {post.comments.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Author author={c.author} when={timeAgo(c.createdAt)} />
                          <p className="mt-1.5 whitespace-pre-line break-words pl-[2.625rem] text-sm text-ink">
                            {c.body}
                          </p>
                        </div>
                        {c.canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              api
                                .deleteComment(c.id)
                                .then(load)
                                .catch(fail)
                            }
                            aria-label="Сэтгэгдэл устгах"
                            title="Устгах"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft/70 hover:bg-coral/10 hover:text-coral"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    <Composer
                      compact
                      placeholder="Сэтгэгдлээ бичих..."
                      max={MAX_COMMENT}
                      submitLabel="Илгээх"
                      onSubmit={async (body) => {
                        try {
                          await api.addComment(post.id, body);
                          await load();
                        } catch (err) {
                          fail(err);
                          throw err;
                        }
                      }}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
