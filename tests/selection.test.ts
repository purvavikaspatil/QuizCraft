import { describe, expect, it } from "vitest";
import { categories, questionBank } from "@/data";
import { shuffle } from "@/lib/quiz/random";
import {
  filterQuestions,
  getTimingWarning,
  selectQuestions,
  toAttemptQuestion,
  validateQuizConfig,
} from "@/lib/quiz/selection";
import { validateQuestionBank } from "@/lib/quiz/validation";
import { DIFFICULTIES } from "@/types/quiz";
import { makeConfig, seededRandom, testBank, testCategories } from "./helpers";

describe("question bank", () => {
  it("passes structural validation with unique ids", () => {
    expect(validateQuestionBank(questionBank, categories)).toEqual([]);
  });

  it("has at least 10 questions per category and every difficulty populated", () => {
    for (const category of categories) {
      const inCategory = questionBank.filter((question) => question.categoryId === category.id);
      expect(inCategory.length).toBeGreaterThanOrEqual(10);
      for (const difficulty of DIFFICULTIES) {
        expect(inCategory.some((question) => question.difficulty === difficulty)).toBe(true);
      }
    }
  });

  it("does not repeat question text", () => {
    const prompts = questionBank.map((question) => question.prompt.toLowerCase());
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it("reports duplicate ids and broken questions", () => {
    // Drops option "c", which is the correct answer for test questions.
    const broken = { ...testBank[0], options: [testBank[0].options[0], testBank[0].options[1], testBank[0].options[3]] };
    const report = validateQuestionBank([testBank[0], testBank[0], broken], testCategories);
    expect(report.map((item) => item.problems.join())).toEqual([
      "Duplicate question id",
      "Must have exactly four options,Correct option id is not one of the options,Duplicate question id",
    ]);
  });
});

describe("filterQuestions", () => {
  it("filters by category and difficulty", () => {
    expect(filterQuestions(testBank, "alpha", "all")).toHaveLength(9);
    expect(filterQuestions(testBank, "alpha", "medium").map((question) => question.id)).toEqual([
      "a-m1",
      "a-m2",
      "a-m3",
    ]);
    expect(filterQuestions(testBank, "beta", "hard")).toEqual([]);
  });
});

describe("validateQuizConfig", () => {
  it("accepts a config with enough matching questions", () => {
    const result = validateQuizConfig(makeConfig({ questionCount: 5 }), testBank, testCategories);
    expect(result.ok && result.count).toBe(5);
  });

  it("resolves 'all' to the number of matching questions", () => {
    const result = validateQuizConfig(makeConfig({ difficulty: "hard", questionCount: "all" }), testBank, testCategories);
    expect(result.ok && result.count).toBe(2);
  });

  it("rejects requests for more questions than are available with a helpful message", () => {
    const result = validateQuizConfig(makeConfig({ difficulty: "easy", questionCount: 5 }), testBank, testCategories);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.matchingCount).toBe(4);
      expect(result.errors.questionCount).toBe(
        "Only 4 questions match these filters. Choose a smaller quiz size or change the difficulty.",
      );
    }
  });

  it("rejects unknown categories, difficulties, counts and timer values", () => {
    const result = validateQuizConfig(
      makeConfig({
        categoryId: "nope",
        difficulty: "extreme" as never,
        questionCount: 7 as never,
        timed: true,
        timeLimitMinutes: 3 as never,
      }),
      testBank,
      testCategories,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["categoryId", "difficulty", "questionCount", "timeLimitMinutes"]);
    }
  });

  it("explains when no questions match at all", () => {
    const result = validateQuizConfig(makeConfig({ categoryId: "beta", difficulty: "hard" }), testBank, testCategories);
    expect(!result.ok && result.errors.difficulty).toMatch(/No questions match/);
  });
});

describe("selectQuestions", () => {
  const matching = filterQuestions(testBank, "alpha", "all");

  it("selects the requested number of unique questions", () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const selected = selectQuestions(matching, 5, { shuffleQuestions: true, random: seededRandom(seed) });
      expect(selected).toHaveLength(5);
      expect(new Set(selected.map((question) => question.id)).size).toBe(5);
      for (const question of selected) expect(matching).toContain(question);
    }
  });

  it("never duplicates questions to reach a larger count", () => {
    expect(selectQuestions(matching, 50, { shuffleQuestions: true })).toHaveLength(matching.length);
  });

  it("keeps question-bank order when shuffling is off", () => {
    const selected = selectQuestions(matching, 9, { shuffleQuestions: false, random: seededRandom(3) });
    expect(selected.map((question) => question.id)).toEqual(matching.map((question) => question.id));
  });

  it("shuffling preserves question identity", () => {
    const selected = selectQuestions(matching, 9, { shuffleQuestions: true, random: seededRandom(7) });
    expect([...selected].map((question) => question.id).sort()).toEqual(matching.map((question) => question.id).sort());
  });
});

describe("shuffle", () => {
  it("returns a permutation without mutating the input", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input, seededRandom(42));
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...output].sort()).toEqual(input);
  });
});

describe("answer options", () => {
  it("shuffling options preserves the correct answer by id", () => {
    const question = testBank[0];
    const correctText = question.options.find((option) => option.id === question.correctOptionId)?.text;
    let positionsSeen = new Set<number>();
    for (let seed = 1; seed <= 30; seed += 1) {
      const snapshot = toAttemptQuestion(question, { shuffleOptions: true, random: seededRandom(seed) });
      expect(snapshot.options).toHaveLength(4);
      expect(snapshot.correctOptionId).toBe(question.correctOptionId);
      const correct = snapshot.options.find((option) => option.id === snapshot.correctOptionId);
      expect(correct?.text).toBe(correctText);
      positionsSeen = positionsSeen.add(snapshot.options.indexOf(correct!));
    }
    // With 30 different seeds the correct option should land in several positions.
    expect(positionsSeen.size).toBeGreaterThan(1);
  });

  it("keeps the original order when option shuffling is off", () => {
    const snapshot = toAttemptQuestion(testBank[0], { shuffleOptions: false });
    expect(snapshot.options.map((option) => option.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("getTimingWarning", () => {
  it("warns only when there is less than 30 seconds per question", () => {
    expect(getTimingWarning(10, 5)).toBeNull();
    expect(getTimingWarning(15, 5)).toMatch(/20 seconds per question/);
    expect(getTimingWarning(0, 5)).toBeNull();
  });
});
