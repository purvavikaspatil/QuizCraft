import type { DifficultyFilter, FinalAttemptStatus, QuizAttempt } from "@/types/quiz";
import { roundPercentage, scoreAttempt } from "./scoring";

export interface DashboardStats {
  attemptCount: number;
  /** Rounded mean of attempt percentages; null when there are no attempts. */
  averagePercentage: number | null;
  bestPercentage: number | null;
  totalCorrect: number;
  totalQuestions: number;
}

export function getFinishedAttempts(attempts: readonly QuizAttempt[]): QuizAttempt[] {
  return attempts
    .filter((attempt) => attempt.status !== "in_progress")
    .sort((a, b) => (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt));
}

export function getInProgressAttempts(attempts: readonly QuizAttempt[]): QuizAttempt[] {
  return attempts
    .filter((attempt) => attempt.status === "in_progress")
    .sort((a, b) => b.startedAt - a.startedAt);
}

/** Aggregates statistics from finished attempts only. */
export function computeDashboardStats(attempts: readonly QuizAttempt[]): DashboardStats {
  const finished = attempts.filter((attempt) => attempt.status !== "in_progress");
  if (finished.length === 0) {
    return { attemptCount: 0, averagePercentage: null, bestPercentage: null, totalCorrect: 0, totalQuestions: 0 };
  }

  let sum = 0;
  let best = 0;
  let totalCorrect = 0;
  let totalQuestions = 0;
  for (const attempt of finished) {
    const result = scoreAttempt(attempt);
    sum += result.exactPercentage;
    best = Math.max(best, result.percentage);
    totalCorrect += result.correct;
    totalQuestions += result.total;
  }

  return {
    attemptCount: finished.length,
    averagePercentage: roundPercentage(sum / finished.length),
    bestPercentage: best,
    totalCorrect,
    totalQuestions,
  };
}

export type HistorySort = "recent" | "highest" | "lowest";

export interface HistoryFilters {
  categoryId: string | "any";
  /** "any" = no filter; "all" = attempts that used mixed difficulty. */
  difficulty: DifficultyFilter | "any";
  status: FinalAttemptStatus | "any";
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = { categoryId: "any", difficulty: "any", status: "any" };

export function filterAndSortHistory(
  attempts: readonly QuizAttempt[],
  filters: HistoryFilters,
  sort: HistorySort,
): QuizAttempt[] {
  const filtered = getFinishedAttempts(attempts).filter(
    (attempt) =>
      (filters.categoryId === "any" || attempt.config.categoryId === filters.categoryId) &&
      (filters.difficulty === "any" || attempt.config.difficulty === filters.difficulty) &&
      (filters.status === "any" || attempt.status === filters.status),
  );

  if (sort === "recent") return filtered;

  const scored = filtered.map((attempt) => ({ attempt, score: scoreAttempt(attempt).exactPercentage }));
  // Array.prototype.sort is stable, so ties keep most-recent-first order.
  scored.sort((a, b) => (sort === "highest" ? b.score - a.score : a.score - b.score));
  return scored.map((item) => item.attempt);
}
