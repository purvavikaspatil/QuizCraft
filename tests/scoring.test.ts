import { describe, expect, it } from "vitest";
import { calculatePercentage, getTimeTakenMs, roundPercentage, scoreAnswers } from "@/lib/quiz/scoring";
import { toAttemptQuestion } from "@/lib/quiz/selection";
import { testBank } from "./helpers";

// Every test question's correct option id is "c".
const questions = testBank.slice(0, 4).map((question) => toAttemptQuestion(question, { shuffleOptions: false }));
const ids = questions.map((question) => question.questionId);

describe("scoreAnswers", () => {
  it("scores all-correct answers", () => {
    const answers = Object.fromEntries(ids.map((id) => [id, "c"]));
    expect(scoreAnswers(questions, answers)).toEqual({
      total: 4,
      correct: 4,
      incorrect: 0,
      unanswered: 0,
      exactPercentage: 100,
      percentage: 100,
    });
  });

  it("scores all-incorrect answers", () => {
    const answers = Object.fromEntries(ids.map((id) => [id, "a"]));
    expect(scoreAnswers(questions, answers)).toMatchObject({ correct: 0, incorrect: 4, unanswered: 0, percentage: 0 });
  });

  it("scores mixed answers", () => {
    const answers = { [ids[0]]: "c", [ids[1]]: "c", [ids[2]]: "b", [ids[3]]: "d" };
    expect(scoreAnswers(questions, answers)).toMatchObject({ correct: 2, incorrect: 2, unanswered: 0, percentage: 50 });
  });

  it("counts unanswered questions as zero using total questions as the denominator", () => {
    const answers = { [ids[0]]: "c" };
    expect(scoreAnswers(questions, answers)).toMatchObject({
      total: 4,
      correct: 1,
      incorrect: 0,
      unanswered: 3,
      percentage: 25,
    });
  });

  it("uses the stable option id, not the displayed position", () => {
    const shuffled = { ...questions[0], options: [...questions[0].options].reverse() };
    expect(scoreAnswers([shuffled], { [shuffled.questionId]: "c" }).correct).toBe(1);
  });

  it("treats answers that are not valid options as unanswered", () => {
    expect(scoreAnswers(questions, { [ids[0]]: "zzz" })).toMatchObject({ correct: 0, incorrect: 0, unanswered: 4 });
  });

  it("scores a duplicated question only once", () => {
    const result = scoreAnswers([questions[0], questions[0]], { [ids[0]]: "c" });
    expect(result).toMatchObject({ total: 1, correct: 1, percentage: 100 });
  });

  it("handles zero-question attempts without NaN", () => {
    const result = scoreAnswers([], {});
    expect(result).toEqual({ total: 0, correct: 0, incorrect: 0, unanswered: 0, exactPercentage: 0, percentage: 0 });
  });
});

describe("percentages", () => {
  it("rounds consistently while keeping exact values", () => {
    expect(calculatePercentage(1, 3)).toBeCloseTo(33.333, 2);
    expect(roundPercentage(calculatePercentage(1, 3))).toBe(33);
    expect(roundPercentage(calculatePercentage(2, 3))).toBe(67);
    expect(roundPercentage(calculatePercentage(1, 8))).toBe(13); // 12.5 rounds up
  });

  it("never returns NaN or Infinity for malformed input", () => {
    expect(calculatePercentage(3, 0)).toBe(0);
    expect(calculatePercentage(Number.NaN, 5)).toBe(0);
    expect(calculatePercentage(5, Number.POSITIVE_INFINITY)).toBe(0);
    expect(calculatePercentage(7, 5)).toBe(100);
    expect(roundPercentage(Number.NaN)).toBe(0);
  });
});

describe("getTimeTakenMs", () => {
  it("returns elapsed time for finished attempts only", () => {
    expect(getTimeTakenMs({ startedAt: 1000, finishedAt: 61_000 })).toBe(60_000);
    expect(getTimeTakenMs({ startedAt: 1000, finishedAt: null })).toBeNull();
    expect(getTimeTakenMs({ startedAt: 5000, finishedAt: 1000 })).toBe(0);
  });
});
