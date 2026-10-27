"use client";

import { useSyncExternalStore } from "react";
import { quizStore, type StoreState } from "./store";

/**
 * Subscribes a component to persisted QuizCraft data. On the server and during
 * hydration this returns `ready: false`, so components render a loading state
 * instead of guessing at localStorage contents.
 */
export function useQuizStore(): StoreState {
  return useSyncExternalStore(quizStore.subscribe, quizStore.getSnapshot, quizStore.getServerSnapshot);
}
