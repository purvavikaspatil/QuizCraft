import {
  ATTEMPT_STATUSES,
  DIFFICULTIES,
  QUESTION_COUNT_CHOICES,
  TIME_LIMIT_CHOICES,
  type AttemptQuestion,
  type DifficultyFilter,
  type QuizAttempt,
  type QuizConfig,
  type UserPreferences,
} from "@/types/quiz";

/*
 * Runtime validation for anything read back from localStorage. Stored data can
 * be stale, edited by hand or written by an older version of the app, so
 * nothing is trusted just because it parsed as JSON.
 */

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  defaultDifficulty: "all",
  defaultQuestionCount: 5,
  defaultTimed: false,
  defaultTimeLimitMinutes: 10,
  shuffleQuestions: true,
  shuffleOptions: true,
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isDifficultyFilter(value: unknown): value is DifficultyFilter {
  return value === "all" || DIFFICULTIES.includes(value as never);
}

export function isQuestionCountChoice(value: unknown): value is UserPreferences["defaultQuestionCount"] {
  return QUESTION_COUNT_CHOICES.includes(value as never);
}

export function isTimeLimitChoice(value: unknown): value is UserPreferences["defaultTimeLimitMinutes"] {
  return TIME_LIMIT_CHOICES.includes(value as never);
}

export function isThemePreference(value: unknown): value is UserPreferences["theme"] {
  return value === "light" || value === "dark" || value === "system";
}

function isQuizConfig(value: unknown): value is QuizConfig {
  return (
    isRecord(value) &&
    isString(value.categoryId) &&
    isDifficultyFilter(value.difficulty) &&
    isQuestionCountChoice(value.questionCount) &&
    typeof value.timed === "boolean" &&
    isTimeLimitChoice(value.timeLimitMinutes) &&
    typeof value.shuffleQuestions === "boolean" &&
    typeof value.shuffleOptions === "boolean"
  );
}

function isAttemptQuestion(value: unknown): value is AttemptQuestion {
  if (!isRecord(value)) return false;
  if (
    !isString(value.questionId) ||
    !DIFFICULTIES.includes(value.difficulty as never) ||
    typeof value.topic !== "string" ||
    !isString(value.prompt) ||
    !isString(value.correctOptionId) ||
    typeof value.explanation !== "string" ||
    !Array.isArray(value.options) ||
    value.options.length !== 4
  ) {
    return false;
  }
  const options = value.options as unknown[];
  const ok = options.every((option) => isRecord(option) && isString(option.id) && isString(option.text));
  return ok && options.some((option) => (option as UnknownRecord).id === value.correctOptionId);
}

/** Type guard for a stored attempt, including internal consistency checks. */
export function isQuizAttempt(value: unknown): value is QuizAttempt {
  if (!isRecord(value)) return false;
  if (
    !isString(value.id) ||
    !isQuizConfig(value.config) ||
    typeof value.categoryName !== "string" ||
    !Array.isArray(value.questions) ||
    value.questions.length === 0 ||
    !value.questions.every(isAttemptQuestion) ||
    !isRecord(value.answers) ||
    !Object.values(value.answers).every((answer) => typeof answer === "string") ||
    !Number.isInteger(value.currentIndex) ||
    !ATTEMPT_STATUSES.includes(value.status as never) ||
    !isFiniteNumber(value.startedAt) ||
    !(value.deadline === null || isFiniteNumber(value.deadline)) ||
    !(value.finishedAt === null || isFiniteNumber(value.finishedAt))
  ) {
    return false;
  }

  // A finished attempt needs a finish time; an in-progress one must not have one.
  const finished = value.status !== "in_progress";
  return finished === (value.finishedAt !== null);
}

/** Normalizes a valid attempt (e.g. clamps an out-of-range currentIndex). */
export function normalizeAttempt(attempt: QuizAttempt): QuizAttempt {
  const maxIndex = attempt.questions.length - 1;
  if (attempt.currentIndex >= 0 && attempt.currentIndex <= maxIndex) return attempt;
  return { ...attempt, currentIndex: Math.min(Math.max(0, attempt.currentIndex), maxIndex) };
}

/**
 * Builds preferences field by field so one bad value falls back to its default
 * instead of discarding every saved preference.
 */
export function parsePreferences(value: unknown): { preferences: UserPreferences; hadInvalidFields: boolean } {
  if (!isRecord(value)) return { preferences: { ...DEFAULT_PREFERENCES }, hadInvalidFields: value !== undefined };

  let hadInvalidFields = false;
  function pick<K extends keyof UserPreferences>(
    key: K,
    guard: (input: unknown) => input is UserPreferences[K],
  ): UserPreferences[K] {
    const candidate = (value as UnknownRecord)[key];
    if (candidate === undefined) return DEFAULT_PREFERENCES[key];
    if (guard(candidate)) return candidate;
    hadInvalidFields = true;
    return DEFAULT_PREFERENCES[key];
  }
  const isBoolean = (input: unknown): input is boolean => typeof input === "boolean";

  const preferences: UserPreferences = {
    theme: pick("theme", isThemePreference),
    defaultDifficulty: pick("defaultDifficulty", isDifficultyFilter),
    defaultQuestionCount: pick("defaultQuestionCount", isQuestionCountChoice),
    defaultTimed: pick("defaultTimed", isBoolean),
    defaultTimeLimitMinutes: pick("defaultTimeLimitMinutes", isTimeLimitChoice),
    shuffleQuestions: pick("shuffleQuestions", isBoolean),
    shuffleOptions: pick("shuffleOptions", isBoolean),
  };
  return { preferences, hadInvalidFields };
}
