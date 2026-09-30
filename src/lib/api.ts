import { authStorage } from './authStorage';
import { ApiError } from './types';
import type { AvatarOptions } from './avatar';
import type {
  Assignment,
  AssignmentDetail,
  BalanceInfo,
  ClaimResult,
  Class,
  ClassGroup,
  ClassPeople,
  GameSession,
  GameState,
  Group,
  Material,
  AppNotification,
  Note,
  NoteAttachment,
  PointTransaction,
  PurchaseResult,
  Quiz,
  ShopItem,
  StreakStatus,
  Submission,
  SubmitResult,
  User,
} from './types';

const BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = authStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { ...authHeaders() };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || data.error || 'Request failed', res.status, data);
  }
  return data as T;
}

/** POST a file as multipart/form-data. Content-Type is left for the browser
 * to set (it needs to add the multipart boundary), unlike `request`. */
async function uploadFile<T>(path: string, file: File): Promise<T> {
  return postForm<T>(path, {}, file);
}

/** POST arbitrary string fields plus an optional file as one
 * multipart/form-data request — used where a form has both regular fields
 * and an optional attachment (e.g. creating an assignment). */
async function postForm<T>(
  path: string,
  fields: Record<string, string | undefined>,
  file?: File | null,
): Promise<T> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) formData.append(key, value);
  }
  if (file) formData.append('file', file);
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || data.error || 'Илгээхэд алдаа гарлаа', res.status, data);
  }
  return data as T;
}

/** GET a binary response as a Blob, for a route that can't be reached via a
 * plain `<a href>` because auth here is a bearer token, not a cookie — a
 * top-level navigation wouldn't carry the Authorization header. */
async function downloadFile(path: string): Promise<{ blob: Blob; fileName: string }> {
  const res = await fetch(BASE + path, { headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.message || data.error || 'Татахад алдаа гарлаа', res.status, data);
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const starMatch = /filename\*=UTF-8''([^;]+)/.exec(disposition);
  const plainMatch = /filename="?([^";]+)"?/.exec(disposition);
  const fileName = starMatch
    ? decodeURIComponent(starMatch[1])
    : (plainMatch?.[1] ?? 'file');
  return { blob: await res.blob(), fileName };
}

export const api = {
  // auth
  signup: (payload: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('POST', '/auth/signup', payload),
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>('POST', '/auth/login', payload),
  logout: () => request('POST', '/auth/logout'),
  me: () => request<User>('GET', '/auth/me'),
  updateProfile: (name: string) => request<User>('PATCH', '/me/profile', { name }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('POST', '/me/password', { currentPassword, newPassword }),
  deleteAccount: (password: string) => request('DELETE', '/me', { password }),
  equipAvatar: (itemId: string | null) =>
    request<{ equippedItemId: string | null }>('PUT', '/me/avatar/equip', { itemId }),
  updateAvatar: (options: AvatarOptions) =>
    request<{ avatarOptions: AvatarOptions }>('PATCH', '/me/avatar', options),

  // groups
  createGroup: (name: string) => request<Group>('POST', '/groups', { name }),
  joinGroup: (code: string) => request<Group>('POST', '/groups/join', { code }),

  // notes
  listNotes: (groupId: string) => request<Note[]>('GET', `/groups/${groupId}/notes`),
  createNote: (groupId: string, title: string) =>
    request<Note>('POST', `/groups/${groupId}/notes`, { title }),
  listClassNotes: (classId: string) =>
    request<Note[]>('GET', `/classes/${classId}/notes`),
  createClassNote: (classId: string, title: string) =>
    request<Note>('POST', `/classes/${classId}/notes`, { title }),
  listMyNotes: () => request<Note[]>('GET', '/me/notes'),
  createMyNote: (title: string) => request<Note>('POST', '/me/notes', { title }),
  listMyQuizzes: () => request<Quiz[]>('GET', '/me/quizzes'),
  deleteNote: (noteId: string) => request('DELETE', `/notes/${noteId}`),
  getNote: (noteId: string) => request<Note>('GET', `/notes/${noteId}`),
  updateNote: (noteId: string, patch: { title?: string; content?: string; baseUpdatedAt?: string }) =>
    request<Note>('PATCH', `/notes/${noteId}`, patch),

  // quizzes
  generateQuiz: (noteId: string, count: number, mode?: string) =>
    request<Quiz>('POST', `/notes/${noteId}/generate-quiz`, { count, mode }),
  listQuizzes: (groupId: string) => request<Quiz[]>('GET', `/groups/${groupId}/quizzes`),
  listClassQuizzes: (classId: string) =>
    request<Quiz[]>('GET', `/classes/${classId}/quizzes`),
  deleteQuiz: (quizId: string) => request('DELETE', `/quizzes/${quizId}`),
  getQuiz: (quizId: string) => request<Quiz>('GET', `/quizzes/${quizId}`),

  // live game — polling-based (no WebSocket/pub-sub service is configured
  // anywhere in this repo). Poll getGameState every ~1.5s while on the play
  // screen; every mutating call below returns the fresh GameState too, so
  // the caller can apply it immediately without waiting for the next poll.
  createGame: (quizId: string) => request<GameSession>('POST', '/games', { quizId }),
  lookupGameByCode: (code: string) => request<GameSession>('GET', `/games/code/${code}`),
  joinGame: (id: string) => request<GameState>('POST', `/games/${id}/join`),
  getGameState: (id: string) => request<GameState>('GET', `/games/${id}/state`),
  startGame: (id: string) => request<GameState>('POST', `/games/${id}/start`),
  answerGame: (id: string, optionIndex: number) =>
    request<GameState>('POST', `/games/${id}/answer`, { optionIndex }),
  revealGame: (id: string) => request<GameState>('POST', `/games/${id}/reveal`),
  nextGame: (id: string) => request<GameState>('POST', `/games/${id}/next`),

  // classroom
  myClasses: () => request<Class[]>('GET', '/me/classes'),
  createClass: (payload: {
    name: string;
    color?: string;
    section?: string;
    level?: string;
    subject?: string;
    room?: string;
  }) => request<Class>('POST', '/classes', payload),
  updateClass: (
    id: string,
    patch: Partial<{
      name: string;
      color: string;
      section: string | null;
      level: string | null;
      subject: string | null;
      room: string | null;
      groupId: string | null;
    }>,
  ) => request<Class>('PATCH', `/classes/${id}`, patch),
  // Teachers can also join another teacher's class by code, as a
  // full co-teacher — same call, the backend branches on role.
  joinClass: (code: string) => request<Class>('POST', '/classes/join', { code }),
  getClass: (id: string) => request<Class>('GET', `/classes/${id}`),
  listClassGroups: () => request<ClassGroup[]>('GET', '/class-groups'),
  createClassGroup: (name: string) =>
    request<ClassGroup>('POST', '/class-groups', { name }),
  deleteClassGroup: (id: string) => request('DELETE', `/class-groups/${id}`),
  getPeople: (classId: string) =>
    request<ClassPeople>('GET', `/classes/${classId}/people`),
  setMemberAdmin: (classId: string, userId: string, admin: boolean) =>
    request('PATCH', `/classes/${classId}/members/${userId}`, { admin }),
  removeMember: (classId: string, userId: string) =>
    request('DELETE', `/classes/${classId}/members/${userId}`),
  listMaterials: (classId: string) =>
    request<Material[]>('GET', `/classes/${classId}/materials`),
  uploadMaterial: (classId: string, file: File) =>
    uploadFile<Material>(`/classes/${classId}/materials`, file),
  downloadMaterial: (materialId: string) =>
    downloadFile(`/materials/${materialId}`),
  deleteMaterial: (materialId: string) =>
    request('DELETE', `/materials/${materialId}`),
  listNotifications: () =>
    request<{ items: AppNotification[]; unread: number }>('GET', '/notifications'),
  markNotificationsRead: () => request('POST', '/notifications/read'),
  listNoteAttachments: (noteId: string) =>
    request<NoteAttachment[]>('GET', `/notes/${noteId}/attachments`),
  uploadNoteAttachment: (noteId: string, file: File) =>
    uploadFile<NoteAttachment>(`/notes/${noteId}/attachments`, file),
  downloadNoteAttachment: (attachmentId: string) =>
    downloadFile(`/note-attachments/${attachmentId}`),
  deleteNoteAttachment: (attachmentId: string) =>
    request('DELETE', `/note-attachments/${attachmentId}`),
  deleteAssignment: (assignmentId: string) =>
    request('DELETE', `/assignments/${assignmentId}`),
  deleteClass: (classId: string) => request('DELETE', `/classes/${classId}`),
  leaveClass: (classId: string) =>
    request('DELETE', `/classes/${classId}/membership`),
  listAssignments: (classId: string) =>
    request<Assignment[]>('GET', `/classes/${classId}/assignments`),
  createAssignment: (
    classId: string,
    payload: {
      title: string;
      dueAt: string | null;
      /** Optional — an assignment can have no quiz (plain instructional
       * item, no auto-grading). */
      quizId?: string;
      /** Optional — a file to attach, uploaded in the same request. */
      file?: File | null;
    },
  ) =>
    postForm<Assignment>(
      `/classes/${classId}/assignments`,
      {
        title: payload.title,
        dueAt: payload.dueAt ?? undefined,
        quizId: payload.quizId,
      },
      payload.file,
    ),
  getAssignment: (id: string) => request<AssignmentDetail>('GET', `/assignments/${id}`),
  submitAssignment: (id: string, payload: { answers: (number | null)[] }) =>
    request<SubmitResult>('POST', `/assignments/${id}/submit`, payload),
  listSubmissions: (assignmentId: string) =>
    request<Submission[]>('GET', `/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId: string, score: number) =>
    request<Submission>('PATCH', `/submissions/${submissionId}`, { score }),

  // points / gamification
  getBalance: () => request<BalanceInfo>('GET', '/points/balance'),
  getPointsHistory: (page = 1) =>
    request<{ history: PointTransaction[]; page: number; pageSize: number }>(
      'GET',
      `/points/history?page=${page}`
    ),
  getStreakStatus: () => request<StreakStatus>('GET', '/streak'),
  claimStreak: () => request<ClaimResult>('POST', '/streak/claim'),
  listShopItems: () => request<{ items: ShopItem[] }>('GET', '/shop/items'),
  purchaseItem: (itemId: string) =>
    request<PurchaseResult>('POST', '/shop/purchase', { itemId }),
  getInventory: () => request<{ items: ShopItem[] }>('GET', '/inventory'),
};
