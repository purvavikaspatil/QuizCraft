"use client";

import { CircleCheck, Database, Monitor, Moon, RotateCcw, Sun, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SegmentedControl, Switch } from "@/components/ui/form-controls";
import { LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { DIFFICULTY_LABELS } from "@/lib/quiz/format";
import { getFinishedAttempts, getInProgressAttempts } from "@/lib/quiz/stats";
import {
  isDifficultyFilter,
  isQuestionCountChoice,
  isThemePreference,
  isTimeLimitChoice,
} from "@/lib/storage/schema";
import { quizStore } from "@/lib/storage/store";
import { useQuizStore } from "@/lib/storage/use-quiz-store";
import { QUESTION_COUNT_CHOICES, TIME_LIMIT_CHOICES, type UserPreferences } from "@/types/quiz";

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-6 space-y-6">{children}</div>
    </Card>
  );
}

export function SettingsView() {
  const { ready, preferences, attempts, persistent } = useQuizStore();
  const toast = useToast();
  const [status, setStatus] = useState<{ tone: "saved" | "error"; message: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!ready) return <LoadingState label="Loading your preferences…" />;

  /** Validates a single preference, saves it and reports the outcome inline. */
  function save<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
    isValid: (input: unknown) => boolean,
  ) {
    if (!isValid(value)) {
      setStatus({ tone: "error", message: "That value isn't supported. Your previous setting was kept." });
      return;
    }
    const { persisted } = quizStore.updatePreferences({ [key]: value } as Partial<UserPreferences>);
    setStatus(
      persisted
        ? { tone: "saved", message: "Preferences saved." }
        : { tone: "error", message: "Couldn't save to this browser. The change applies until you leave." },
    );
  }
  const isBoolean = (input: unknown) => typeof input === "boolean";

  function resetPreferences() {
    const { persisted } = quizStore.resetPreferences();
    setConfirmReset(false);
    toast(
      persisted
        ? { tone: "success", title: "Preferences reset", description: "All settings are back to their defaults." }
        : { tone: "warning", title: "Preferences reset for this visit", description: "This browser isn't allowing QuizCraft to save." },
    );
    setStatus(null);
  }

  const finishedCount = getFinishedAttempts(attempts).length;
  const inProgressCount = getInProgressAttempts(attempts).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Preferences are saved automatically in this browser and used as the starting point for new quizzes."
      />

      <div
        aria-live="polite"
        className="mb-4 min-h-6 text-sm"
      >
        {status ? (
          <p
            className={
              status.tone === "saved"
                ? "inline-flex items-center gap-1.5 text-success"
                : "inline-flex items-center gap-1.5 text-danger"
            }
          >
            {status.tone === "saved" ? <CircleCheck className="size-4" aria-hidden /> : <TriangleAlert className="size-4" aria-hidden />}
            {status.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        <Section title="Appearance" description="Choose how QuizCraft looks. System follows your device setting.">
          <SegmentedControl
            legend="Theme"
            value={preferences.theme}
            onChange={(theme) => save("theme", theme, isThemePreference)}
            options={[
              { value: "light", label: <><Sun className="mr-1.5 size-4" aria-hidden />Light</>, ariaLabel: "Light" },
              { value: "dark", label: <><Moon className="mr-1.5 size-4" aria-hidden />Dark</>, ariaLabel: "Dark" },
              { value: "system", label: <><Monitor className="mr-1.5 size-4" aria-hidden />System</>, ariaLabel: "System" },
            ]}
          />
        </Section>

        <Section
          title="Quiz defaults"
          description="Used to pre-fill Quiz Setup. You can still change anything for an individual quiz. Past attempts are never affected."
        >
          <SegmentedControl
            legend="Default difficulty"
            value={preferences.defaultDifficulty}
            onChange={(value) => save("defaultDifficulty", value, isDifficultyFilter)}
            options={(["all", "easy", "medium", "hard"] as const).map((value) => ({
              value,
              label: value === "all" ? "All difficulties" : DIFFICULTY_LABELS[value],
            }))}
          />
          <SegmentedControl
            legend="Default number of questions"
            value={preferences.defaultQuestionCount}
            onChange={(value) => save("defaultQuestionCount", value, isQuestionCountChoice)}
            hint="If fewer questions match your choices, Quiz Setup will tell you before you start."
            options={QUESTION_COUNT_CHOICES.map((value) => ({
              value,
              label: value === "all" ? "All available" : String(value),
            }))}
          />
          <div className="border-t border-border pt-6">
            <Switch
              label="Timed quizzes by default"
              description="Start new quizzes with a countdown timer."
              checked={preferences.defaultTimed}
              onChange={(value) => save("defaultTimed", value, isBoolean)}
            />
          </div>
          <SegmentedControl
            legend="Default time limit"
            value={preferences.defaultTimeLimitMinutes}
            onChange={(value) => save("defaultTimeLimitMinutes", value, isTimeLimitChoice)}
            hint={preferences.defaultTimed ? undefined : "Applies when you turn on the timer."}
            options={TIME_LIMIT_CHOICES.map((value) => ({ value, label: `${value} min`, ariaLabel: `${value} minutes` }))}
          />
          <div className="space-y-6 border-t border-border pt-6">
            <Switch
              label="Shuffle questions"
              description="Present questions in a random order."
              checked={preferences.shuffleQuestions}
              onChange={(value) => save("shuffleQuestions", value, isBoolean)}
            />
            <Switch
              label="Shuffle answer options"
              description="Randomize the order of the four options for each question."
              checked={preferences.shuffleOptions}
              onChange={(value) => save("shuffleOptions", value, isBoolean)}
            />
          </div>
        </Section>

        <Section title="Your data" description="QuizCraft has no accounts. Everything is stored locally in this browser.">
          <div className="flex items-start gap-3 rounded-xl bg-surface-muted p-4 text-sm">
            <Database className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
            <div className="space-y-1 text-muted">
              <p className="text-fg">
                {persistent
                  ? `${finishedCount} finished attempt${finishedCount === 1 ? "" : "s"} and ${inProgressCount} quiz${
                      inProgressCount === 1 ? "" : "zes"
                    } in progress saved in this browser.`
                  : "This browser isn't allowing QuizCraft to save data, so progress lasts only until you leave."}
              </p>
              <p>
                Data isn&apos;t synced between devices or browsers, and clearing your browser data removes it. Manage saved attempts in{" "}
                <Link href="/history" className="font-medium text-accent-text hover:underline">
                  Quiz history
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Reset preferences</p>
              <p className="text-sm text-muted">Restore every setting on this page to its default. Quiz history is not affected.</p>
            </div>
            <Button variant="secondary" onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden /> Reset preferences
            </Button>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        icon={<RotateCcw />}
        title="Reset all preferences?"
        description="Theme and quiz defaults will return to their original values. Your quiz history and any quiz in progress are not affected."
        confirmLabel="Reset preferences"
        onConfirm={resetPreferences}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
