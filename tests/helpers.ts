import type { StorageLike } from "@/lib/storage/repository";
import type { QuizCategory, QuizConfig, QuizQuestion } from "@/types/quiz";

/** Deterministic pseudo-random generator (mulberry32) for repeatable shuffles. */
export function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("QuotaExceededError");
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

export const testCategories: QuizCategory[] = [
  { id: "alpha", name: "Alpha", description: "Test category", icon: "code", topics: ["A"] },
  { id: "beta", name: "Beta", description: "Test category", icon: "globe", topics: ["B"] },
];

function makeQuestion(id: string, categoryId: string, difficulty: QuizQuestion["difficulty"]): QuizQuestion {
  return {
    id,
    categoryId,
    difficulty,
    topic: "Topic",
    prompt: `Question ${id}?`,
    options: [
      { id: "a", text: `${id} option A` },
      { id: "b", text: `${id} option B` },
      { id: "c", text: `${id} option C` },
      { id: "d", text: `${id} option D` },
    ],
    correctOptionId: "c",
    explanation: `Because ${id}.`,
  };
}

/** alpha: 4 easy, 3 medium, 2 hard (9 total). beta: 2 easy. */
export const testBank: QuizQuestion[] = [
  ...["a-e1", "a-e2", "a-e3", "a-e4"].map((id) => makeQuestion(id, "alpha", "easy")),
  ...["a-m1", "a-m2", "a-m3"].map((id) => makeQuestion(id, "alpha", "medium")),
  ...["a-h1", "a-h2"].map((id) => makeQuestion(id, "alpha", "hard")),
  ...["b-e1", "b-e2"].map((id) => makeQuestion(id, "beta", "easy")),
];

export function makeConfig(overrides: Partial<QuizConfig> = {}): QuizConfig {
  return {
    categoryId: "alpha",
    difficulty: "all",
    questionCount: 5,
    timed: false,
    timeLimitMinutes: 10,
    shuffleQuestions: false,
    shuffleOptions: false,
    ...overrides,
  };
}
