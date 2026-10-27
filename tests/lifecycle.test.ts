import { describe, expect, it } from "vitest";
import {
  createAttempt,
  createRetryAttempt,
  finalizeAttempt,
  getAnsweredCount,
  getRemainingMs,
  goToQuestion,
  resolveExpiredAttempt,
  selectAnswer,
} from "@/lib/attempts/lifecycle";
import { scoreAttempt } from "@/lib/quiz/scoring";
import type { QuizAttempt } from "@/types/quiz";
import { makeConfig, seededRandom, testBank, testCategories } from "./helpers";

const T0 = 1_700_000_000_000;
const env = { bank: testBank, categories: testCategories, now: T0, random: seededRandom(1) };

function newAttempt(overrides = {}, id = "attempt-1"): QuizAttempt {
  const result = createAttempt(makeConfig(overrides), { ...env, id });
  if (!result.ok) throw new Error("expected a valid attempt");
  return result.attempt;
}

function answer(attempt: QuizAttempt, index: number, optionId: string, now = T0 + 1000): QuizAttempt {
  const result = selectAnswer(attempt, attempt.questions[index].questionId, optionId, now);
  if (!result.ok) throw new Error(result.reason);
  return result.attempt;
}

describe("createAttempt", () => {
  it("initializes an untimed attempt", () => {
    const attempt = newAttempt();
    expect(attempt).toMatchObject({
      id: "attempt-1",
      categoryName: "Alpha",
      status: "in_progress",
      currentIndex: 0,
      answers: {},
      startedAt: T0,
      deadline: null,
      finishedAt: null,
    });
    expect(attempt.questions).toHaveLength(5);
  });

  it("sets a deadline for timed attempts", () => {
    const attempt = newAttempt({ timed: true, timeLimitMinutes: 5 });
    expect(attempt.deadline).toBe(T0 + 5 * 60_000);
    expect(getRemainingMs(attempt, T0 + 60_000)).toBe(4 * 60_000);
  });

  it("returns validation errors instead of an attempt when the config is invalid", () => {
    const result = createAttempt(makeConfig({ difficulty: "hard", questionCount: 10 }), env);
    expect(result.ok).toBe(false);
  });

  it("generates unique ids when none is provided", () => {
    const a = createAttempt(makeConfig(), { ...env, id: undefined });
    const b = createAttempt(makeConfig(), { ...env, id: undefined });
    expect(a.ok && b.ok && a.attempt.id !== b.attempt.id).toBe(true);
  });
});

describe("answering and navigation", () => {
  it("saves and changes an answer, keeping one answer per question", () => {
    let attempt = newAttempt();
    attempt = answer(attempt, 0, "a");
    expect(getAnsweredCount(attempt)).toBe(1);
    attempt = answer(attempt, 0, "c");
    expect(attempt.answers[attempt.questions[0].questionId]).toBe("c");
    expect(getAnsweredCount(attempt)).toBe(1);
  });

  it("returns the same object when the same option is selected again", () => {
    const attempt = answer(newAttempt(), 0, "b");
    const again = selectAnswer(attempt, attempt.questions[0].questionId, "b", T0 + 2000);
    expect(again.ok && again.attempt).toBe(attempt);
  });

  it("rejects unknown questions and invalid options", () => {
    const attempt = newAttempt();
    expect(selectAnswer(attempt, "missing", "a", T0)).toEqual({ ok: false, reason: "unknown_question" });
    expect(selectAnswer(attempt, attempt.questions[0].questionId, "x", T0)).toEqual({
      ok: false,
      reason: "invalid_option",
    });
  });

  it("navigates without losing answers and clamps out-of-range indices", () => {
    let attempt = answer(answer(newAttempt(), 0, "c"), 1, "a");
    attempt = goToQuestion(attempt, 3);
    attempt = goToQuestion(attempt, 0);
    attempt = goToQuestion(attempt, 99);
    expect(attempt.currentIndex).toBe(4);
    attempt = goToQuestion(attempt, -5);
    expect(attempt.currentIndex).toBe(0);
    expect(getAnsweredCount(attempt)).toBe(2);
    expect(scoreAttempt(attempt)).toMatchObject({ correct: 1, incorrect: 1, unanswered: 3 });
  });
});

describe("finalizeAttempt", () => {
  it("finalizes exactly once and rejects duplicate submissions", () => {
    const attempt = answer(newAttempt(), 0, "c");
    const first = finalizeAttempt(attempt, "completed", T0 + 60_000);
    expect(first.changed).toBe(true);
    expect(first.attempt).toMatchObject({ status: "completed", finishedAt: T0 + 60_000 });

    const second = finalizeAttempt(first.attempt, "completed", T0 + 90_000);
    expect(second.changed).toBe(false);
    expect(second.attempt).toBe(first.attempt);
  });

  it("records early endings distinctly and scores unanswered as zero", () => {
    const attempt = answer(newAttempt(), 0, "c");
    const { attempt: ended } = finalizeAttempt(attempt, "ended_early", T0 + 5000);
    expect(ended.status).toBe("ended_early");
    expect(scoreAttempt(ended)).toMatchObject({ correct: 1, unanswered: 4, percentage: 20 });
  });

  it("prevents edits after completion", () => {
    const { attempt } = finalizeAttempt(newAttempt(), "completed", T0 + 1000);
    expect(selectAnswer(attempt, attempt.questions[0].questionId, "c", T0 + 2000)).toEqual({
      ok: false,
      reason: "finalized",
    });
  });
});

describe("timer expiration", () => {
  const timed = () => newAttempt({ timed: true, timeLimitMinutes: 5 });
  const deadline = T0 + 5 * 60_000;

  it("rejects answers after the deadline", () => {
    const attempt = timed();
    expect(selectAnswer(attempt, attempt.questions[0].questionId, "c", deadline)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("keeps answers selected before the deadline and records the deadline as finish time", () => {
    const attempt = answer(timed(), 4, "c", deadline - 1);
    const result = resolveExpiredAttempt(attempt, deadline + 3_600_000);
    expect(result.changed).toBe(true);
    expect(result.attempt).toMatchObject({ status: "timed_out", finishedAt: deadline });
    expect(scoreAttempt(result.attempt).correct).toBe(1);
  });

  it("treats a submit after the deadline as a timeout", () => {
    const { attempt } = finalizeAttempt(timed(), "completed", deadline + 10);
    expect(attempt).toMatchObject({ status: "timed_out", finishedAt: deadline });
  });

  it("does nothing for attempts that have not expired", () => {
    const attempt = timed();
    expect(resolveExpiredAttempt(attempt, deadline - 1)).toEqual({ attempt, changed: false });
    const untimed = newAttempt();
    expect(resolveExpiredAttempt(untimed, T0 + 10 ** 10).changed).toBe(false);
  });
});

describe("createRetryAttempt", () => {
  it("creates a new attempt with the same settings and a reset state", () => {
    const original = finalizeAttempt(answer(newAttempt({ timed: true }), 0, "c"), "completed", T0 + 1000).attempt;
    const retry = createRetryAttempt(original, { ...env, now: T0 + 5000, id: undefined });
    expect(retry.ok).toBe(true);
    if (retry.ok) {
      expect(retry.attempt.id).not.toBe(original.id);
      expect(retry.attempt.config).toEqual(original.config);
      expect(retry.attempt).toMatchObject({ status: "in_progress", answers: {}, currentIndex: 0, startedAt: T0 + 5000 });
      expect(retry.attempt.deadline).toBe(T0 + 5000 + 10 * 60_000);
    }
  });
});
