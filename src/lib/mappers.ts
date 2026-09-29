import type {
  AssignmentRow,
  ClassGroupRow,
  ClassMaterialRow,
  ClassRow,
  GameSessionRow,
  GroupRow,
  NoteRow,
  QuizRow,
  SubmissionRow,
} from '@/db/schema';
import type {
  Assignment,
  Class,
  ClassGroup,
  GameSession,
  Group,
  Material,
  Note,
  Quiz,
  Submission,
} from '@/lib/types';

// Maps database rows (Date objects, DB-only fields) to the wire types the
// frontend expects (ISO strings, joined display fields). Keeps that
// translation in one place instead of repeating it in every route.

export const toGroup = (row: GroupRow): Group => ({
  id: row.id,
  name: row.name,
  code: row.code,
  createdAt: row.createdAt.toISOString(),
});

export const toNote = (row: NoteRow, updatedByName?: string): Note => ({
  id: row.id,
  groupId: row.groupId,
  classId: row.classId,
  title: row.title,
  content: row.content,
  updatedAt: row.updatedAt.toISOString(),
  updatedBy: row.updatedBy,
  updatedByName,
});

export const toQuiz = (row: QuizRow): Quiz => ({
  id: row.id,
  groupId: row.groupId,
  classId: row.classId,
  sourceNoteId: row.sourceNoteId,
  title: row.title,
  questions: row.questions,
  generatedBy: row.generatedBy,
  createdAt: row.createdAt.toISOString(),
});

export const toGameSession = (row: GameSessionRow): GameSession => ({
  id: row.id,
  code: row.code,
});

export const toClass = (
  row: ClassRow,
  teacherName: string,
  extra?: { memberCount?: number; groupName?: string | null },
): Class => ({
  id: row.id,
  name: row.name,
  code: row.code,
  teacherId: row.teacherId,
  teacherName,
  color: row.color,
  section: row.section,
  level: row.level,
  subject: row.subject,
  room: row.room,
  groupId: row.groupId,
  groupName: extra?.groupName ?? null,
  createdAt: row.createdAt.toISOString(),
  memberCount: extra?.memberCount,
});

export const toClassGroup = (row: ClassGroupRow): ClassGroup => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

/** `row` must omit the `data` column (see the materials routes) — list
 * responses never carry file bytes, only the download endpoint does. */
export const toMaterial = (
  row: Omit<ClassMaterialRow, 'data'>,
): Material => ({
  id: row.id,
  classId: row.classId,
  uploadedBy: row.uploadedBy,
  fileName: row.fileName,
  mimeType: row.mimeType,
  sizeBytes: row.sizeBytes,
  createdAt: row.createdAt.toISOString(),
});

export const toAssignment = (
  row: AssignmentRow,
  extra?: {
    mySubmission?: Assignment['mySubmission'];
    submissionCount?: number;
  },
): Assignment => ({
  id: row.id,
  classId: row.classId,
  quizId: row.quizId,
  materialId: row.materialId,
  title: row.title,
  dueAt: row.dueAt ? row.dueAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
  mySubmission: extra?.mySubmission,
  submissionCount: extra?.submissionCount,
});

export const toSubmission = (
  row: SubmissionRow,
  studentName: string,
): Submission => ({
  id: row.id,
  assignmentId: row.assignmentId,
  studentId: row.studentId,
  studentName,
  answers: row.answers,
  score: row.score,
  submittedAt: row.submittedAt.toISOString(),
});
