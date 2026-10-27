import { resolveExpiredAttempt } from "@/lib/attempts/lifecycle";
import type { QuizAttempt, UserPreferences } from "@/types/quiz";
import {
  STORAGE_KEYS,
  describeLoadIssue,
  getBrowserStorage,
  loadAttempts,
  loadPreferences,
  saveAttempts,
  savePreferences,
  type StorageLike,
} from "./repository";
import { DEFAULT_PREFERENCES } from "./schema";

export interface StoreState {
  /** False until browser storage has been read (always false on the server). */
  ready: boolean;
  /** False when localStorage is unavailable; data then lives only in memory. */
  persistent: boolean;
  attempts: QuizAttempt[];
  preferences: UserPreferences;
  /** User-facing messages about storage problems, shown once as toasts. */
  notices: string[];
}

export interface MutationResult {
  persisted: boolean;
}

export const STORAGE_UNAVAILABLE_MESSAGE =
  "Your history could not be saved in this browser. You can continue, but this attempt may not be available after you leave.";

const SERVER_STATE: StoreState = Object.freeze({
  ready: false,
  persistent: false,
  attempts: [],
  preferences: DEFAULT_PREFERENCES,
  notices: [],
}) as StoreState;

interface StoreOptions {
  getStorage: () => StorageLike | null;
  now?: () => number;
  /** Keep multiple tabs in sync via the `storage` event (browser only). */
  syncAcrossTabs?: boolean;
}

/**
 * A tiny external store (for useSyncExternalStore) that owns all persisted
 * QuizCraft data. Every mutation goes through here, so every page derives its
 * view from the same attempts and preferences.
 */
export function createQuizStore({ getStorage, now = Date.now, syncAcrossTabs = false }: StoreOptions) {
  let state: StoreState = SERVER_STATE;
  let storage: StorageLike | null = null;
  let invalidEntries: unknown[] = [];
  let initialized = false;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function setState(next: Partial<StoreState>) {
    state = { ...state, ...next };
    emit();
  }

  function readFromStorage(): Pick<StoreState, "attempts" | "preferences" | "notices"> {
    if (!storage) return { attempts: [], preferences: { ...DEFAULT_PREFERENCES }, notices: [] };

    const loadedAttempts = loadAttempts(storage, now());
    const loadedPreferences = loadPreferences(storage, now());
    invalidEntries = loadedAttempts.invalidEntries;

    // Timers keep running while the tab is closed; finalize anything that expired.
    let expiredChanged = false;
    const attempts = loadedAttempts.attempts.map((attempt) => {
      const result = resolveExpiredAttempt(attempt, now());
      expiredChanged ||= result.changed;
      return result.attempt;
    });
    if (expiredChanged) saveAttempts(storage, attempts, invalidEntries);
    // Write repaired preferences back so the same problem isn't reported on every visit.
    if (loadedPreferences.issues.length > 0) savePreferences(storage, loadedPreferences.preferences);

    return {
      attempts,
      preferences: loadedPreferences.preferences,
      notices: [...loadedAttempts.issues, ...loadedPreferences.issues].map(describeLoadIssue),
    };
  }

  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== null && event.key !== STORAGE_KEYS.attempts && event.key !== STORAGE_KEYS.preferences) {
      return;
    }
    const { attempts, preferences } = readFromStorage();
    setState({ attempts, preferences });
  }

  function init() {
    if (initialized) return;
    initialized = true;
    storage = getStorage();
    const loaded = readFromStorage();
    state = {
      ready: true,
      persistent: storage !== null,
      attempts: loaded.attempts,
      preferences: loaded.preferences,
      notices: storage ? loaded.notices : [STORAGE_UNAVAILABLE_MESSAGE],
    };
    if (syncAcrossTabs && typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageEvent);
    }
  }

  function persistAttempts(attempts: QuizAttempt[]): MutationResult {
    setState({ attempts });
    return { persisted: storage ? saveAttempts(storage, attempts, invalidEntries) : false };
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!initialized) {
        init();
        // Notify after subscribing so React picks up the freshly loaded state.
        queueMicrotask(emit);
      }
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot(): StoreState {
      return state;
    },

    getServerSnapshot(): StoreState {
      return SERVER_STATE;
    },

    /** Loads storage synchronously (used by tests and imperative callers). */
    ensureReady(): StoreState {
      init();
      return state;
    },

    getAttempt(id: string): QuizAttempt | undefined {
      return state.attempts.find((attempt) => attempt.id === id);
    },

    /** Inserts or replaces an attempt by id, so an attempt is never stored twice. */
    saveAttempt(attempt: QuizAttempt): MutationResult {
      init();
      const exists = state.attempts.some((item) => item.id === attempt.id);
      const attempts = exists
        ? state.attempts.map((item) => (item.id === attempt.id ? attempt : item))
        : [...state.attempts, attempt];
      return persistAttempts(attempts);
    },

    /**
     * Applies a pure update to the latest stored copy of an attempt. Returning
     * the same object from `updater` is treated as "no change".
     */
    updateAttempt(
      id: string,
      updater: (attempt: QuizAttempt) => QuizAttempt,
    ): MutationResult & { attempt: QuizAttempt | null; changed: boolean } {
      init();
      const current = state.attempts.find((item) => item.id === id);
      if (!current) return { attempt: null, changed: false, persisted: false };
      const next = updater(current);
      if (next === current) return { attempt: current, changed: false, persisted: state.persistent };
      const result = persistAttempts(state.attempts.map((item) => (item.id === id ? next : item)));
      return { attempt: next, changed: true, ...result };
    },

    /** Removes finished attempts. In-progress attempts are not history and are kept. */
    clearHistory(): MutationResult {
      init();
      invalidEntries = [];
      return persistAttempts(state.attempts.filter((attempt) => attempt.status === "in_progress"));
    },

    updatePreferences(patch: Partial<UserPreferences>): MutationResult {
      init();
      const preferences = { ...state.preferences, ...patch };
      setState({ preferences });
      return { persisted: storage ? savePreferences(storage, preferences) : false };
    },

    resetPreferences(): MutationResult {
      init();
      const preferences = { ...DEFAULT_PREFERENCES };
      setState({ preferences });
      return { persisted: storage ? savePreferences(storage, preferences) : false };
    },

    dismissNotices() {
      if (state.notices.length > 0) setState({ notices: [] });
    },
  };
}

export type QuizStore = ReturnType<typeof createQuizStore>;

/** The app-wide store, backed by window.localStorage. */
export const quizStore = createQuizStore({ getStorage: getBrowserStorage, syncAcrossTabs: true });
