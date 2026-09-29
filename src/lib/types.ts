import type { AvatarOptions } from './avatar';

export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  avatarOptions: AvatarOptions | null;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface Note {
  id: string;
  groupId: string | null;
  classId: string | null;
  title: string;
  content: string;
  updatedAt: string;
  updatedBy: string;
  /** Resolved display name for updatedBy — populated by class-note routes,
   * which already have the class roster on hand. */
  updatedByName?: string;
}

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  groupId: string | null;
  classId: string | null;
  sourceNoteId: string;
  title: string;
  questions: Question[];
  generatedBy: 'ai' | 'rule-based';
  createdAt: string;
}

export interface GameSession {
  id: string;
  code: string;
}

export type GameStatus = 'lobby' | 'active' | 'finished';

export interface GameQuestionView {
  prompt: string;
  options: string[];
  /** Only present once the host has revealed the current question. */
  correctIndex?: number;
  /** Live per-option answer counts — only present once revealed. */
  tally?: number[];
}

export interface GameState {
  id: string;
  code: string;
  status: GameStatus;
  isHost: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionStartedAt: string | null;
  revealed: boolean;
  question: GameQuestionView | null;
  /** The caller's own chosen option for the current question, if any. */
  myAnswer: number | null;
  players: { id: string; name: string; score: number }[];
}

export interface LeaderboardRow {
  id: string;
  rank: number;
  name: string;
  score: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  connected: boolean;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  /** One of CLASS_COLORS' keys, see src/lib/classColor.ts. */
  color: string;
  section: string | null;
  level: string | null;
  subject: string | null;
  room: string | null;
  /** The folder this class sits in on its owner's class list, if any. */
  groupId: string | null;
  groupName: string | null;
  createdAt: string;
  /** Enrolled student count. Only populated by GET /classes/:id. */
  memberCount?: number;
}

/** A teacher's own folder for organizing their class list. */
export interface ClassGroup {
  id: string;
  name: string;
  createdAt: string;
}

export interface Material {
  id: string;
  classId: string;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export interface ClassPeople {
  /** Primary teacher first, then any co-teachers who joined by code. */
  teachers: { id: string; name: string; isPrimary: boolean }[];
  students: { id: string; name: string }[];
}

export interface Assignment {
  id: string;
  classId: string;
  /** Null for a plain, quiz-less classwork item — no auto-grading. */
  quizId: string | null;
  /** Null when no file was attached at creation. */
  materialId: string | null;
  title: string;
  dueAt: string | null;
  createdAt: string;
  /** Populated for students by the list endpoint, so a "Done" badge can
   * show without opening every assignment. Undefined for teachers. */
  mySubmission?: { score: number | null; submittedAt: string } | null;
  /** Populated for the teacher by the list endpoint: how many students
   * have submitted so far. Undefined for students. */
  submissionCount?: number;
}

export interface AssignmentDetail extends Assignment {
  /** Null for a quiz-less assignment. */
  quiz: Quiz | null;
  mySubmission?: Submission | null;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  answers: (number | null)[];
  /** Null until graded — always the case for a quiz-less assignment unless
   * the teacher enters a grade manually. */
  score: number | null;
  submittedAt: string;
}

export interface SubmitResult {
  /** Null for a quiz-less assignment — nothing to auto-score. */
  score: number | null;
  correctCount: number | null;
  totalQuestions: number;
}

export type ShopItemCategory = 'avatarPreset';

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  category: ShopItemCategory;
  value: string;
  price: number;
  createdAt: string;
  owned: boolean;
}

export interface PurchaseResult {
  item: Omit<ShopItem, 'owned'>;
  balance: number;
}

export interface BalanceInfo {
  balance: number;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastClaimedDate: string | null;
  canClaimToday: boolean;
  nextRewardPoints: number;
}

export interface ClaimResult {
  streakDay: number;
  pointsAwarded: number;
  balance: number;
}

export type PointTransactionType =
  | 'quiz_placement'
  | 'daily_streak'
  | 'shop_purchase'
  | 'admin_adjustment';

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: PointTransactionType;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload;
  constructor(message: string, status: number, payload: ApiErrorPayload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}
