import type { AttemptQuestion, AttemptResult, QuizAttempt } from "@/types/quiz";

export type QuestionOutcome = "correct" | "incorrect" | "unanswered";

/** Unrounded percentage; 0 for empty or malformed input instead of NaN/Infinity. */
export function calculatePercentage(correct: number, total: number): number {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0 || correct <= 0) return 0;
  return (Math.min(correct, total) / total) * 100;
}

/** Display rounding: nearest whole number, halves round up. */
export function roundPercentage(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/**
 * Classifies a single answer. An answer that does not match one of the
 * question's options (e.g. tampered storage) counts as unanswered.
 */
export function getQuestionOutcome(
  question: AttemptQuestion,
  selectedOptionId: string | undefined,
): QuestionOutcome {
  if (!selectedOptionId || !question.options.some((option) => option.id === selectedOptionId)) {
    return "unanswered";
  }
  return selectedOptionId === question.correctOptionId ? "correct" : "incorrect";
}

/**
 * Scores an attempt by comparing selected option ids with each question's
 * correct option id. Each question id is scored at most once, and the total
 * number of questions is the denominator, so unanswered questions score zero.
 */
export function scoreAnswers(
  questions: readonly AttemptQuestion[],
  answers: Readonly<Record<string, string>>,
): AttemptResult {
  const seen = new Set<string>();
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const question of questions) {
    if (seen.has(question.questionId)) continue;
    seen.add(question.questionId);

    const outcome = getQuestionOutcome(question, answers[question.questionId]);
    if (outcome === "correct") correct += 1;
    else if (outcome === "incorrect") incorrect += 1;
    else unanswered += 1;
  }

  const total = seen.size;
  const exactPercentage = calculatePercentage(correct, total);
  return {
    total,
    correct,
    incorrect,
    unanswered,
    exactPercentage,
    percentage: roundPercentage(exactPercentage),
  };
}

export function scoreAttempt(attempt: Pick<QuizAttempt, "questions" | "answers">): AttemptResult {
  return scoreAnswers(attempt.questions, attempt.answers);
}

/** Elapsed time for a finished attempt, or null when it is not available. */
export function getTimeTakenMs(attempt: Pick<QuizAttempt, "startedAt" | "finishedAt">): number | null {
  if (attempt.finishedAt === null) return null;
  const elapsed = attempt.finishedAt - attempt.startedAt;
  return Number.isFinite(elapsed) ? Math.max(0, elapsed) : null;
}
