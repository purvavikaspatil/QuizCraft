/**
 * Shared domain models for QuizCraft.
 *
 * These types are used by the question bank, the pure quiz logic in `lib/`,
 * the persistence layer and the UI. Keep them free of React and browser APIs.
 */

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** A difficulty selection for a quiz: one level, or every level mixed. */
export type DifficultyFilter = Difficulty | "all";

export const CATEGORY_ICONS = ["code", "globe", "flask"] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export interface QuizCategory {
  id: string;
  name: string;
  description: string;
  icon: CategoryIcon;
  /** Short list of topics shown on cards and used by search. */
  topics: string[];
}

export interface AnswerOption {
  /** Stable within a question (e.g. "a"); never derived from display position. */
  id: string;
  text: string;
}

export interface QuizQuestion {
  /** Globally unique and stable across releases (e.g. "prog-001"). */
  id: string;
  categoryId: string;
  difficulty: Difficulty;
  topic: string;
  prompt: string;
  options: AnswerOption[];
  correctOptionId: string;
  explanation: string;
}

export const QUESTION_COUNT_CHOICES = [5, 10, 15, "all"] as const;
export type QuestionCountChoice = (typeof QUESTION_COUNT_CHOICES)[number];

export const TIME_LIMIT_CHOICES = [5, 10, 15, 20, 30] as const;
export type TimeLimitMinutes = (typeof TIME_LIMIT_CHOICES)[number];

export interface QuizConfig {
  categoryId: string;
  difficulty: DifficultyFilter;
  questionCount: QuestionCountChoice;
  timed: boolean;
  /** Only meaningful when `timed` is true. */
  timeLimitMinutes: TimeLimitMinutes;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

/**
 * A snapshot of a question as it was presented in an attempt. Storing the
 * snapshot keeps historical results accurate even if the question bank changes.
 */
export interface AttemptQuestion {
  questionId: string;
  difficulty: Difficulty;
  topic: string;
  prompt: string;
  /** Options in the order they were displayed for this attempt. */
  options: AnswerOption[];
  correctOptionId: string;
  explanation: string;
}

export const ATTEMPT_STATUSES = [
  "in_progress",
  "completed",
  "timed_out",
  "ended_early",
] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];
export type FinalAttemptStatus = Exclude<AttemptStatus, "in_progress">;

export interface QuizAttempt {
  id: string;
  config: QuizConfig;
  /** Category name at the time of the attempt. */
  categoryName: string;
  questions: AttemptQuestion[];
  /** Map of questionId -> selected optionId. Missing key = unanswered. */
  answers: Record<string, string>;
  currentIndex: number;
  status: AttemptStatus;
  /** Epoch milliseconds. */
  startedAt: number;
  /** Epoch ms when a timed attempt expires; null for untimed attempts. */
  deadline: number | null;
  finishedAt: number | null;
}

export interface AttemptResult {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  /** Rounded to the nearest whole number for display. */
  percentage: number;
  /** Unrounded percentage, useful for averages. */
  exactPercentage: number;
}

export type ThemePreference = "light" | "dark" | "system";

export interface UserPreferences {
  theme: ThemePreference;
  defaultDifficulty: DifficultyFilter;
  defaultQuestionCount: QuestionCountChoice;
  defaultTimed: boolean;
  defaultTimeLimitMinutes: TimeLimitMinutes;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}
