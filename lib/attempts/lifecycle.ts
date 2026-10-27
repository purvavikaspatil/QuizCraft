import { getCategory, questionBank as defaultBank, categories as defaultCategories } from "@/data";
import { createAttemptId, type RandomFn } from "@/lib/quiz/random";
import {
  selectQuestions,
  toAttemptQuestion,
  validateQuizConfig,
  type ConfigField,
} from "@/lib/quiz/selection";
import type {
  FinalAttemptStatus,
  QuizAttempt,
  QuizCategory,
  QuizConfig,
  QuizQuestion,
} from "@/types/quiz";

/*
 * Attempt lifecycle rules
 * -----------------------
 * - An attempt starts as "in_progress" and is finalized exactly once.
 * - "completed": the user submitted (unanswered questions count as incorrect
 *   for the percentage, but are reported separately as unanswered).
 * - "ended_early": the user chose End Quiz before submitting. Scored the same
 *   way, but labelled so it is never presented as a normal completion.
 * - "timed_out": the deadline passed. Answers selected before the deadline are
 *   kept; finishedAt is the deadline itself.
 * - Finalized attempts are read-only: answer changes are rejected.
 * All functions are pure and return new objects.
 */

export interface CreateAttemptOptions {
  bank?: readonly QuizQuestion[];
  categories?: readonly QuizCategory[];
  now?: number;
  random?: RandomFn;
  id?: string;
}

export type CreateAttemptResult =
  | { ok: true; attempt: QuizAttempt }
  | { ok: false; errors: Partial<Record<ConfigField, string>> };

export function createAttempt(config: QuizConfig, options: CreateAttemptOptions = {}): CreateAttemptResult {
  const bank = options.bank ?? defaultBank;
  const categories = options.categories ?? defaultCategories;
  const now = options.now ?? Date.now();
  const random = options.random ?? Math.random;

  const validation = validateQuizConfig(config, bank, categories);
  if (!validation.ok) return { ok: false, errors: validation.errors };

  const selected = selectQuestions(validation.matching, validation.count, {
    shuffleQuestions: config.shuffleQuestions,
    random,
  });
  const category =
    categories.find((item) => item.id === config.categoryId) ?? getCategory(config.categoryId);

  return {
    ok: true,
    attempt: {
      id: options.id ?? createAttemptId(),
      config: { ...config },
      categoryName: category?.name ?? config.categoryId,
      questions: selected.map((question) =>
        toAttemptQuestion(question, { shuffleOptions: config.shuffleOptions, random }),
      ),
      answers: {},
      currentIndex: 0,
      status: "in_progress",
      startedAt: now,
      deadline: config.timed ? now + config.timeLimitMinutes * 60_000 : null,
      finishedAt: null,
    },
  };
}

export function isFinalized(attempt: QuizAttempt): boolean {
  return attempt.status !== "in_progress";
}

export function isExpired(attempt: QuizAttempt, now: number): boolean {
  return attempt.status === "in_progress" && attempt.deadline !== null && now >= attempt.deadline;
}

export function getRemainingMs(attempt: QuizAttempt, now: number): number | null {
  if (attempt.deadline === null) return null;
  return Math.max(0, attempt.deadline - now);
}

export function getAnsweredCount(attempt: QuizAttempt): number {
  return attempt.questions.filter((question) => {
    const selected = attempt.answers[question.questionId];
    return selected !== undefined && question.options.some((option) => option.id === selected);
  }).length;
}

export type AnswerRejection = "finalized" | "expired" | "unknown_question" | "invalid_option";

export type AnswerResult = { ok: true; attempt: QuizAttempt } | { ok: false; reason: AnswerRejection };

/** Records (or changes) the selected option for a question. */
export function selectAnswer(
  attempt: QuizAttempt,
  questionId: string,
  optionId: string,
  now: number,
): AnswerResult {
  if (isFinalized(attempt)) return { ok: false, reason: "finalized" };
  if (isExpired(attempt, now)) return { ok: false, reason: "expired" };

  const question = attempt.questions.find((item) => item.questionId === questionId);
  if (!question) return { ok: false, reason: "unknown_question" };
  if (!question.options.some((option) => option.id === optionId)) {
    return { ok: false, reason: "invalid_option" };
  }
  if (attempt.answers[questionId] === optionId) return { ok: true, attempt };

  return { ok: true, attempt: { ...attempt, answers: { ...attempt.answers, [questionId]: optionId } } };
}

/** Moves to a question index (clamped). Answers are never touched. */
export function goToQuestion(attempt: QuizAttempt, index: number): QuizAttempt {
  const last = Math.max(0, attempt.questions.length - 1);
  const target = Math.min(Math.max(0, Math.floor(index)), last);
  if (target === attempt.currentIndex) return attempt;
  return { ...attempt, currentIndex: target };
}

export interface FinalizeResult {
  attempt: QuizAttempt;
  /** False when the attempt had already been finalized (duplicate submission). */
  changed: boolean;
}

/**
 * Finalizes an attempt exactly once. If the deadline has already passed, the
 * attempt is recorded as timed out regardless of the requested status.
 */
export function finalizeAttempt(
  attempt: QuizAttempt,
  status: FinalAttemptStatus,
  now: number,
): FinalizeResult {
  if (isFinalized(attempt)) return { attempt, changed: false };

  const expired = attempt.deadline !== null && now >= attempt.deadline;
  const finalStatus: FinalAttemptStatus = expired ? "timed_out" : status;
  const finishedAt =
    finalStatus === "timed_out" && attempt.deadline !== null ? Math.min(now, attempt.deadline) : now;

  return { attempt: { ...attempt, status: finalStatus, finishedAt }, changed: true };
}

/** Finalizes an in-progress attempt whose timer ran out (e.g. while the tab was closed). */
export function resolveExpiredAttempt(attempt: QuizAttempt, now: number): FinalizeResult {
  if (!isExpired(attempt, now)) return { attempt, changed: false };
  return finalizeAttempt(attempt, "timed_out", now);
}

/** A retry uses the same settings but a brand-new attempt (new id, questions, timer). */
export function createRetryAttempt(previous: QuizAttempt, options: CreateAttemptOptions = {}): CreateAttemptResult {
  return createAttempt(previous.config, options);
}
