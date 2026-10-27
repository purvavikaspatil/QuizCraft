import { beforeEach, describe, expect, it } from "vitest";
import { createAttempt, finalizeAttempt, selectAnswer } from "@/lib/attempts/lifecycle";
import { computeDashboardStats, filterAndSortHistory, DEFAULT_HISTORY_FILTERS } from "@/lib/quiz/stats";
import {
  STORAGE_KEYS,
  loadAttempts,
  loadPreferences,
  saveAttempts,
  savePreferences,
} from "@/lib/storage/repository";
import { DEFAULT_PREFERENCES } from "@/lib/storage/schema";
import { STORAGE_UNAVAILABLE_MESSAGE, createQuizStore } from "@/lib/storage/store";
import type { QuizAttempt } from "@/types/quiz";
import { MemoryStorage, makeConfig, seededRandom, testBank, testCategories } from "./helpers";

const T0 = 1_700_000_000_000;

function makeAttempt(id: string, correctAnswers: number, overrides = {}, finishedAt: number | null = T0 + 60_000): QuizAttempt {
  const created = createAttempt(makeConfig(overrides), {
    bank: testBank,
    categories: testCategories,
    now: T0,
    random: seededRandom(2),
    id,
  });
  if (!created.ok) throw new Error("invalid config");
  let attempt = created.attempt;
  attempt.questions.slice(0, correctAnswers).forEach((question) => {
    const result = selectAnswer(attempt, question.questionId, question.correctOptionId, T0 + 1);
    if (result.ok) attempt = result.attempt;
  });
  return finishedAt === null ? attempt : finalizeAttempt(attempt, "completed", finishedAt).attempt;
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
});

describe("attempt persistence", () => {
  it("handles empty storage for first-time visitors", () => {
    expect(loadAttempts(storage)).toEqual({ attempts: [], invalidEntries: [], issues: [] });
  });

  it("saves and restores attempts", () => {
    const attempts = [makeAttempt("one", 3), makeAttempt("two", 1, {}, null)];
    expect(saveAttempts(storage, attempts)).toBe(true);
    expect(loadAttempts(storage).attempts).toEqual(attempts);
  });

  it("backs up corrupted JSON instead of silently discarding it", () => {
    storage.setItem(STORAGE_KEYS.attempts, "{not json");
    const loaded = loadAttempts(storage, T0);
    expect(loaded.attempts).toEqual([]);
    expect(loaded.issues[0]).toMatchObject({ kind: "corrupt" });
    expect(storage.getItem(`${STORAGE_KEYS.attempts}:backup:${T0}`)).toBe("{not json");
    // The bad value is moved, not copied, so the next load starts clean without another backup.
    expect(loadAttempts(storage, T0 + 1)).toEqual({ attempts: [], invalidEntries: [], issues: [] });
  });

  it("treats an unknown schema version as incompatible and backs it up", () => {
    storage.setItem(STORAGE_KEYS.attempts, JSON.stringify({ version: 99, attempts: [] }));
    const loaded = loadAttempts(storage, T0);
    expect(loaded.issues[0]).toMatchObject({ kind: "incompatible" });
    expect(storage.getItem(`${STORAGE_KEYS.attempts}:backup:${T0}`)).not.toBeNull();
  });

  it("keeps valid attempts when one entry is malformed and preserves the bad entry on save", () => {
    const good = makeAttempt("good", 2);
    const bad = { id: "bad", status: "completed" };
    storage.setItem(STORAGE_KEYS.attempts, JSON.stringify({ version: 1, attempts: [good, bad] }));

    const loaded = loadAttempts(storage);
    expect(loaded.attempts.map((attempt) => attempt.id)).toEqual(["good"]);
    expect(loaded.issues).toEqual([{ kind: "skipped_entries", count: 1 }]);

    saveAttempts(storage, loaded.attempts, loaded.invalidEntries);
    const raw = JSON.parse(storage.getItem(STORAGE_KEYS.attempts)!);
    expect(raw.attempts).toHaveLength(2);
  });

  it("rejects attempts whose questions reference a missing correct option", () => {
    const attempt = makeAttempt("broken", 1);
    attempt.questions[0] = { ...attempt.questions[0], correctOptionId: "zzz" };
    storage.setItem(STORAGE_KEYS.attempts, JSON.stringify({ version: 1, attempts: [attempt] }));
    expect(loadAttempts(storage).attempts).toEqual([]);
  });

  it("de-duplicates attempts with the same id, preferring the finalized copy", () => {
    const inProgress = makeAttempt("same", 1, {}, null);
    const finished = makeAttempt("same", 1);
    storage.setItem(STORAGE_KEYS.attempts, JSON.stringify({ version: 1, attempts: [inProgress, finished] }));
    const loaded = loadAttempts(storage);
    expect(loaded.attempts).toHaveLength(1);
    expect(loaded.attempts[0].status).toBe("completed");
  });

  it("reports write failures", () => {
    storage.failWrites = true;
    expect(saveAttempts(storage, [makeAttempt("x", 1)])).toBe(false);
  });
});

describe("preference persistence", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadPreferences(storage)).toEqual({ preferences: DEFAULT_PREFERENCES, issues: [] });
  });

  it("saves and restores preferences", () => {
    const preferences = { ...DEFAULT_PREFERENCES, theme: "dark" as const, defaultQuestionCount: 10 as const };
    savePreferences(storage, preferences);
    expect(loadPreferences(storage).preferences).toEqual(preferences);
  });

  it("falls back per field when some stored values are invalid", () => {
    storage.setItem(
      STORAGE_KEYS.preferences,
      JSON.stringify({ version: 1, preferences: { theme: "dark", defaultQuestionCount: 999 } }),
    );
    const loaded = loadPreferences(storage);
    expect(loaded.preferences.theme).toBe("dark");
    expect(loaded.preferences.defaultQuestionCount).toBe(DEFAULT_PREFERENCES.defaultQuestionCount);
    expect(loaded.issues).toEqual([{ kind: "invalid_preferences" }]);
  });

  it("recovers from corrupted preference JSON", () => {
    storage.setItem(STORAGE_KEYS.preferences, "<<<");
    expect(loadPreferences(storage).preferences).toEqual(DEFAULT_PREFERENCES);
  });
});

describe("quiz store", () => {
  function makeStore(now = T0 + 120_000) {
    return createQuizStore({ getStorage: () => storage, now: () => now });
  }

  it("repairs invalid stored preferences once, keeping the valid fields", () => {
    storage.setItem(
      STORAGE_KEYS.preferences,
      JSON.stringify({ version: 1, preferences: { theme: "dark", defaultQuestionCount: 42 } }),
    );
    expect(makeStore().ensureReady().notices).toHaveLength(1);
    expect(loadPreferences(storage)).toEqual({
      preferences: { ...DEFAULT_PREFERENCES, theme: "dark" },
      issues: [],
    });
  });

  it("returns undefined for missing attempt ids", () => {
    const store = makeStore();
    store.ensureReady();
    expect(store.getAttempt("does-not-exist")).toBeUndefined();
  });

  it("stores an attempt once even when saved repeatedly", () => {
    const store = makeStore();
    const attempt = makeAttempt("a", 2);
    store.saveAttempt(attempt);
    store.saveAttempt(attempt);
    expect(store.getSnapshot().attempts).toHaveLength(1);
    expect(loadAttempts(storage).attempts).toHaveLength(1);
  });

  it("ignores duplicate finalization through updateAttempt", () => {
    const store = makeStore();
    store.saveAttempt(makeAttempt("a", 2, {}, null));
    const first = store.updateAttempt("a", (attempt) => finalizeAttempt(attempt, "completed", T0 + 5).attempt);
    const second = store.updateAttempt("a", (attempt) => finalizeAttempt(attempt, "completed", T0 + 9).attempt);
    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(store.getAttempt("a")?.finishedAt).toBe(T0 + 5);
  });

  it("finalizes timed attempts that expired while the app was closed", () => {
    const timed = makeAttempt("timed", 1, { timed: true, timeLimitMinutes: 5 }, null);
    saveAttempts(storage, [timed]);
    const store = makeStore(T0 + 60 * 60_000);
    const state = store.ensureReady();
    expect(state.attempts[0]).toMatchObject({ status: "timed_out", finishedAt: T0 + 5 * 60_000 });
    expect(loadAttempts(storage).attempts[0].status).toBe("timed_out");
  });

  it("retry creates a new attempt rather than overwriting history", () => {
    const store = makeStore();
    const original = makeAttempt("original", 3);
    store.saveAttempt(original);
    const retry = createAttempt(original.config, { bank: testBank, categories: testCategories, id: "retry" });
    if (!retry.ok) throw new Error("retry failed");
    store.saveAttempt(retry.attempt);
    expect(store.getSnapshot().attempts.map((attempt) => attempt.id).sort()).toEqual(["original", "retry"]);
    expect(store.getAttempt("original")).toEqual(original);
  });

  it("clearing history resets derived statistics but keeps in-progress attempts", () => {
    const store = makeStore();
    store.saveAttempt(makeAttempt("a", 5));
    store.saveAttempt(makeAttempt("b", 1));
    store.saveAttempt(makeAttempt("live", 0, {}, null));
    expect(computeDashboardStats(store.getSnapshot().attempts)).toMatchObject({
      attemptCount: 2,
      averagePercentage: 60,
      bestPercentage: 100,
      totalCorrect: 6,
    });

    store.clearHistory();
    const attempts = store.getSnapshot().attempts;
    expect(computeDashboardStats(attempts)).toEqual({
      attemptCount: 0,
      averagePercentage: null,
      bestPercentage: null,
      totalCorrect: 0,
      totalQuestions: 0,
    });
    expect(attempts.map((attempt) => attempt.id)).toEqual(["live"]);
    expect(loadAttempts(storage).attempts.map((attempt) => attempt.id)).toEqual(["live"]);
  });

  it("notifies subscribers on change", () => {
    const store = makeStore();
    store.ensureReady();
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.updatePreferences({ theme: "dark" });
    unsubscribe();
    store.updatePreferences({ theme: "light" });
    expect(calls).toBe(1);
    expect(loadPreferences(storage).preferences.theme).toBe("light");
  });

  it("keeps working in memory when storage is unavailable", () => {
    const store = createQuizStore({ getStorage: () => null });
    const state = store.ensureReady();
    expect(state.persistent).toBe(false);
    expect(state.notices).toEqual([STORAGE_UNAVAILABLE_MESSAGE]);
    expect(store.saveAttempt(makeAttempt("mem", 1)).persisted).toBe(false);
    expect(store.getSnapshot().attempts).toHaveLength(1);
  });
});

describe("history filtering and sorting", () => {
  const attempts = [
    { ...makeAttempt("old-high", 5), finishedAt: T0 + 1000 },
    { ...makeAttempt("new-low", 1), finishedAt: T0 + 3000 },
    { ...makeAttempt("mid", 3, { difficulty: "easy", questionCount: "all" }), finishedAt: T0 + 2000 },
    makeAttempt("live", 0, {}, null),
  ];

  it("excludes in-progress attempts and sorts by most recent by default", () => {
    expect(filterAndSortHistory(attempts, DEFAULT_HISTORY_FILTERS, "recent").map((a) => a.id)).toEqual([
      "new-low",
      "mid",
      "old-high",
    ]);
  });

  it("sorts by score", () => {
    expect(filterAndSortHistory(attempts, DEFAULT_HISTORY_FILTERS, "highest").map((a) => a.id)).toEqual([
      "old-high",
      "mid",
      "new-low",
    ]);
    expect(filterAndSortHistory(attempts, DEFAULT_HISTORY_FILTERS, "lowest").map((a) => a.id)).toEqual([
      "new-low",
      "mid",
      "old-high",
    ]);
  });

  it("filters by difficulty and status", () => {
    expect(
      filterAndSortHistory(attempts, { ...DEFAULT_HISTORY_FILTERS, difficulty: "easy" }, "recent").map((a) => a.id),
    ).toEqual(["mid"]);
    expect(filterAndSortHistory(attempts, { ...DEFAULT_HISTORY_FILTERS, status: "timed_out" }, "recent")).toEqual([]);
  });
});
