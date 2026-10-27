import type { QuizAttempt, UserPreferences } from "@/types/quiz";
import { isQuizAttempt, normalizeAttempt, parsePreferences } from "./schema";

/** The subset of the Web Storage API we rely on; injectable for tests. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEYS = {
  attempts: "quizcraft:attempts",
  preferences: "quizcraft:preferences",
} as const;

export const SCHEMA_VERSION = 1;

export type LoadIssue =
  | { kind: "corrupt"; key: string; backupKey: string | null }
  | { kind: "incompatible"; key: string; backupKey: string | null }
  | { kind: "skipped_entries"; count: number }
  | { kind: "invalid_preferences" };

export interface LoadedAttempts {
  attempts: QuizAttempt[];
  /**
   * Stored entries that failed validation. They are written back untouched on
   * save so a single bad record never wipes out the rest of the history.
   */
  invalidEntries: unknown[];
  issues: LoadIssue[];
}

/** Returns window.localStorage if it exists and is writable, otherwise null. */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probe = "quizcraft:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson(storage: StorageLike, key: string): { ok: true; value: unknown } | { ok: false; raw: string } {
  const raw = storage.getItem(key);
  if (raw === null) return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, raw };
  }
}

/**
 * Moves unreadable data to a backup key so it is never silently overwritten.
 * The original key is cleared only once the backup succeeded, so the same
 * data is not backed up again on every visit.
 */
function backupRaw(storage: StorageLike, key: string, raw: string, now: number): string | null {
  const backupKey = `${key}:backup:${now}`;
  try {
    storage.setItem(backupKey, raw);
    storage.removeItem(key);
    return backupKey;
  } catch {
    return null;
  }
}

function writeJson(storage: StorageLike, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finishedRank(attempt: QuizAttempt): number {
  return attempt.status === "in_progress" ? 0 : 1;
}

export function loadAttempts(storage: StorageLike, now: number = Date.now()): LoadedAttempts {
  const key = STORAGE_KEYS.attempts;
  const read = readJson(storage, key);

  if (!read.ok) {
    const backupKey = backupRaw(storage, key, read.raw, now);
    return { attempts: [], invalidEntries: [], issues: [{ kind: "corrupt", key, backupKey }] };
  }
  if (read.value === undefined) return { attempts: [], invalidEntries: [], issues: [] };

  const envelope = read.value;
  if (!isRecord(envelope) || envelope.version !== SCHEMA_VERSION || !Array.isArray(envelope.attempts)) {
    const backupKey = backupRaw(storage, key, JSON.stringify(envelope), now);
    return { attempts: [], invalidEntries: [], issues: [{ kind: "incompatible", key, backupKey }] };
  }

  const byId = new Map<string, QuizAttempt>();
  const invalidEntries: unknown[] = [];
  for (const entry of envelope.attempts) {
    if (!isQuizAttempt(entry)) {
      invalidEntries.push(entry);
      continue;
    }
    const attempt = normalizeAttempt(entry);
    const existing = byId.get(attempt.id);
    // Never keep two copies of one attempt; prefer the finalized copy.
    if (!existing || finishedRank(attempt) > finishedRank(existing)) byId.set(attempt.id, attempt);
  }

  const issues: LoadIssue[] =
    invalidEntries.length > 0 ? [{ kind: "skipped_entries", count: invalidEntries.length }] : [];
  return { attempts: [...byId.values()], invalidEntries, issues };
}

export function saveAttempts(
  storage: StorageLike,
  attempts: readonly QuizAttempt[],
  invalidEntries: readonly unknown[] = [],
): boolean {
  return writeJson(storage, STORAGE_KEYS.attempts, {
    version: SCHEMA_VERSION,
    attempts: [...attempts, ...invalidEntries],
  });
}

export function loadPreferences(
  storage: StorageLike,
  now: number = Date.now(),
): { preferences: UserPreferences; issues: LoadIssue[] } {
  const key = STORAGE_KEYS.preferences;
  const read = readJson(storage, key);

  if (!read.ok) {
    const backupKey = backupRaw(storage, key, read.raw, now);
    return { preferences: parsePreferences(undefined).preferences, issues: [{ kind: "corrupt", key, backupKey }] };
  }
  if (read.value === undefined) return { preferences: parsePreferences(undefined).preferences, issues: [] };

  const envelope = read.value;
  if (!isRecord(envelope) || envelope.version !== SCHEMA_VERSION) {
    return { preferences: parsePreferences(undefined).preferences, issues: [{ kind: "invalid_preferences" }] };
  }

  const { preferences, hadInvalidFields } = parsePreferences(envelope.preferences);
  return { preferences, issues: hadInvalidFields ? [{ kind: "invalid_preferences" }] : [] };
}

export function savePreferences(storage: StorageLike, preferences: UserPreferences): boolean {
  return writeJson(storage, STORAGE_KEYS.preferences, { version: SCHEMA_VERSION, preferences });
}

export function describeLoadIssue(issue: LoadIssue): string {
  switch (issue.kind) {
    case "corrupt":
    case "incompatible":
      return issue.key === STORAGE_KEYS.preferences
        ? "Your saved preferences couldn't be read, so defaults are being used."
        : "Your saved quiz history couldn't be read. A backup copy was kept in this browser and a fresh history was started.";
    case "skipped_entries":
      return `${issue.count} saved attempt${issue.count === 1 ? " was" : "s were"} unreadable and ${
        issue.count === 1 ? "is" : "are"
      } hidden. The rest of your history is intact.`;
    case "invalid_preferences":
      return "Some saved preferences were invalid and have been reset to their defaults.";
  }
}
