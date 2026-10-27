import type { AttemptStatus, DifficultyFilter } from "@/types/quiz";

export const DIFFICULTY_LABELS: Record<DifficultyFilter, string> = {
  all: "Mixed",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const STATUS_LABELS: Record<AttemptStatus, string> = {
  in_progress: "In progress",
  completed: "Completed",
  timed_out: "Time expired",
  ended_early: "Ended early",
};

/** "mm:ss" (or "h:mm:ss") for countdowns. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

/** Human-readable duration such as "4m 05s" or "38s". */
export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "—";
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(epochMs: number): string {
  return dateTimeFormatter.format(new Date(epochMs));
}

/** Encouraging, honest feedback based only on the actual score. */
export function getScoreFeedback(percentage: number): string {
  if (percentage >= 90) return "Outstanding work — you clearly know this material.";
  if (percentage >= 75) return "Great job! Review the few you missed to lock it in.";
  if (percentage >= 50) return "Solid effort. Reviewing your mistakes is the fastest way to improve.";
  if (percentage > 0) return "Every attempt teaches you something. Review the explanations and try again.";
  return "No correct answers this time. Read through the explanations, then give it another go.";
}
