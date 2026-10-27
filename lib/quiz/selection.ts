import {
  DIFFICULTIES,
  QUESTION_COUNT_CHOICES,
  TIME_LIMIT_CHOICES,
  type AttemptQuestion,
  type DifficultyFilter,
  type QuestionCountChoice,
  type QuizCategory,
  type QuizConfig,
  type QuizQuestion,
} from "@/types/quiz";
import { shuffle, type RandomFn } from "./random";

export type ConfigField = "categoryId" | "difficulty" | "questionCount" | "timeLimitMinutes";

export type ConfigValidation =
  | { ok: true; matching: QuizQuestion[]; count: number }
  | { ok: false; errors: Partial<Record<ConfigField, string>>; matchingCount: number };

/** Below this many seconds per question a timed quiz is flagged as tight. */
export const TIGHT_SECONDS_PER_QUESTION = 30;

export function filterQuestions(
  bank: readonly QuizQuestion[],
  categoryId: string,
  difficulty: DifficultyFilter,
): QuizQuestion[] {
  return bank.filter(
    (question) =>
      question.categoryId === categoryId &&
      (difficulty === "all" || question.difficulty === difficulty),
  );
}

export function resolveQuestionCount(choice: QuestionCountChoice, available: number): number {
  return choice === "all" ? available : choice;
}

function isDifficultyFilter(value: unknown): value is DifficultyFilter {
  return value === "all" || DIFFICULTIES.includes(value as never);
}

function pluralQuestions(count: number): string {
  return `${count} question${count === 1 ? "" : "s"}`;
}

/**
 * Validates a quiz configuration against the question bank. Every value is
 * re-checked because configs can come from URLs, preferences or old attempts.
 */
export function validateQuizConfig(
  config: QuizConfig,
  bank: readonly QuizQuestion[],
  categories: readonly QuizCategory[],
): ConfigValidation {
  const errors: Partial<Record<ConfigField, string>> = {};

  if (!categories.some((category) => category.id === config.categoryId)) {
    errors.categoryId = "Choose a category to continue.";
  }
  if (!isDifficultyFilter(config.difficulty)) {
    errors.difficulty = "Choose a valid difficulty.";
  }
  if (!QUESTION_COUNT_CHOICES.includes(config.questionCount)) {
    errors.questionCount = "Choose a valid number of questions.";
  }
  if (config.timed && !TIME_LIMIT_CHOICES.includes(config.timeLimitMinutes)) {
    errors.timeLimitMinutes = "Choose a valid time limit.";
  }

  if (errors.categoryId || errors.difficulty) {
    return { ok: false, errors, matchingCount: 0 };
  }

  const matching = filterQuestions(bank, config.categoryId, config.difficulty);

  if (matching.length === 0) {
    errors.difficulty = "No questions match this category and difficulty. Try a different difficulty.";
  } else if (!errors.questionCount) {
    const requested = resolveQuestionCount(config.questionCount, matching.length);
    if (requested > matching.length) {
      errors.questionCount =
        matching.length === 1
          ? "Only 1 question matches these filters. Choose a smaller quiz size or change the difficulty."
          : `Only ${matching.length} questions match these filters. Choose a smaller quiz size or change the difficulty.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, matchingCount: matching.length };
  }

  return {
    ok: true,
    matching,
    count: resolveQuestionCount(config.questionCount, matching.length),
  };
}

/**
 * Picks `count` unique questions at random. When `shuffleQuestions` is off the
 * chosen questions keep their question-bank order (easy → hard).
 */
export function selectQuestions(
  matching: readonly QuizQuestion[],
  count: number,
  options: { shuffleQuestions: boolean; random?: RandomFn },
): QuizQuestion[] {
  const random = options.random ?? Math.random;
  const safeCount = Math.max(0, Math.min(Math.floor(count), matching.length));
  const chosen = shuffle(matching, random).slice(0, safeCount);

  if (options.shuffleQuestions) return chosen;

  const bankOrder = new Map(matching.map((question, index) => [question.id, index]));
  return chosen.sort((a, b) => (bankOrder.get(a.id) ?? 0) - (bankOrder.get(b.id) ?? 0));
}

/** Snapshots a question for an attempt, optionally shuffling its options. */
export function toAttemptQuestion(
  question: QuizQuestion,
  options: { shuffleOptions: boolean; random?: RandomFn },
): AttemptQuestion {
  const random = options.random ?? Math.random;
  return {
    questionId: question.id,
    difficulty: question.difficulty,
    topic: question.topic,
    prompt: question.prompt,
    options: (options.shuffleOptions ? shuffle(question.options, random) : question.options).map(
      (option) => ({ ...option }),
    ),
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
  };
}

/** A gentle warning when a timed quiz leaves little time per question. */
export function getTimingWarning(questionCount: number, timeLimitMinutes: number): string | null {
  if (questionCount <= 0) return null;
  const secondsPerQuestion = (timeLimitMinutes * 60) / questionCount;
  if (secondsPerQuestion >= TIGHT_SECONDS_PER_QUESTION) return null;
  return `That's about ${Math.floor(secondsPerQuestion)} seconds per question for ${pluralQuestions(
    questionCount,
  )}. Consider a longer time limit.`;
}
