"use client";

import { ArrowLeft, Play, Settings2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryIcon } from "@/components/quiz/quiz-badges";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl, Switch } from "@/components/ui/form-controls";
import { LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { categories, getCategory, questionBank } from "@/data";
import { createAttempt } from "@/lib/attempts/lifecycle";
import { cn } from "@/lib/cn";
import { DIFFICULTY_LABELS } from "@/lib/quiz/format";
import { filterQuestions, getTimingWarning, validateQuizConfig, type ConfigField } from "@/lib/quiz/selection";
import { STORAGE_UNAVAILABLE_MESSAGE, quizStore } from "@/lib/storage/store";
import { useQuizStore } from "@/lib/storage/use-quiz-store";
import {
  QUESTION_COUNT_CHOICES,
  TIME_LIMIT_CHOICES,
  type DifficultyFilter,
  type QuizConfig,
  type UserPreferences,
} from "@/types/quiz";

const FIELD_IDS: Record<ConfigField, string> = {
  categoryId: "setup-category",
  difficulty: "setup-difficulty",
  questionCount: "setup-count",
  timeLimitMinutes: "setup-time",
};

interface QuizSetupProps {
  initialCategoryId: string | null;
  initialDifficulty: DifficultyFilter | null;
}

export function QuizSetup(props: QuizSetupProps) {
  const { ready, preferences } = useQuizStore();
  if (!ready) return <LoadingState label="Loading your preferences…" />;
  // Preferences are only read once, as initial values the user can override.
  return <QuizSetupForm {...props} preferences={preferences} />;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-fg">{children}</dd>
    </div>
  );
}

function QuizSetupForm({
  initialCategoryId,
  initialDifficulty,
  preferences,
}: QuizSetupProps & { preferences: UserPreferences }) {
  const router = useRouter();
  const toast = useToast();
  const startingRef = useRef(false);
  const [starting, setStarting] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [config, setConfig] = useState<QuizConfig>(() => ({
    categoryId: initialCategoryId ?? "",
    difficulty: initialDifficulty ?? preferences.defaultDifficulty,
    questionCount: preferences.defaultQuestionCount,
    timed: preferences.defaultTimed,
    timeLimitMinutes: preferences.defaultTimeLimitMinutes,
    shuffleQuestions: preferences.shuffleQuestions,
    shuffleOptions: preferences.shuffleOptions,
  }));

  const update = (patch: Partial<QuizConfig>) => setConfig((current) => ({ ...current, ...patch }));

  const validation = validateQuizConfig(config, questionBank, categories);
  const errors = validation.ok ? {} : validation.errors;
  // A missing category is expected before the user picks one; only flag it after they try to start.
  const visibleErrors: Partial<Record<ConfigField, string>> = {
    ...errors,
    categoryId: showAllErrors ? errors.categoryId : undefined,
  };

  const category = getCategory(config.categoryId);
  const categoryQuestions = category ? filterQuestions(questionBank, category.id, "all") : [];
  const matchingCount = category ? filterQuestions(questionBank, category.id, config.difficulty).length : 0;
  const questionCount = validation.ok ? validation.count : null;
  const timingWarning = config.timed && questionCount ? getTimingWarning(questionCount, config.timeLimitMinutes) : null;

  function handleStart() {
    if (startingRef.current) return;
    setShowAllErrors(true);

    if (!validation.ok) {
      const firstInvalid = (Object.keys(FIELD_IDS) as ConfigField[]).find((field) => validation.errors[field]);
      if (firstInvalid) document.getElementById(FIELD_IDS[firstInvalid])?.querySelector("input")?.focus();
      return;
    }

    startingRef.current = true;
    setStarting(true);
    const created = createAttempt(config);
    if (!created.ok) {
      startingRef.current = false;
      setStarting(false);
      toast({ tone: "error", title: "Couldn't start the quiz", description: "Please review the highlighted settings." });
      return;
    }

    if (!quizStore.saveAttempt(created.attempt).persisted) {
      toast({ tone: "warning", title: "Progress won't be saved", description: STORAGE_UNAVAILABLE_MESSAGE });
    }
    router.push(`/quiz/${created.attempt.id}`);
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/quizzes" className="inline-flex items-center gap-1 rounded hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> Explore quizzes
          </Link>
        }
        title="Set up your quiz"
        description="Choose what to practice and how. Defaults come from your settings, and changes here only apply to this quiz."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            handleStart();
          }}
          className="space-y-6"
          aria-label="Quiz settings"
        >
          <Card className="p-5 sm:p-6">
            <fieldset id={FIELD_IDS.categoryId} aria-describedby={visibleErrors.categoryId ? "category-error" : undefined}>
              <legend className="mb-3 text-sm font-medium text-fg">
                Category <span className="text-danger">*</span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(12.5rem,1fr))]">
                {categories.map((item) => {
                  const checked = item.id === config.categoryId;
                  const count = questionBank.filter((question) => question.categoryId === item.id).length;
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                        checked
                          ? "border-accent bg-accent-soft"
                          : "border-border hover:border-border-strong hover:bg-surface-muted",
                        visibleErrors.categoryId && "border-danger-border",
                      )}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={item.id}
                        aria-label={`${item.name}, ${count} questions`}
                        className="sr-only"
                        checked={checked}
                        onChange={() => update({ categoryId: item.id })}
                      />
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg",
                          checked ? "bg-accent text-accent-fg" : "bg-surface-muted text-accent-text",
                        )}
                      >
                        <CategoryIcon icon={item.icon} className="size-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-fg">{item.name}</span>
                        <span className="block text-xs text-muted">{count} questions</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {visibleErrors.categoryId ? (
                <p id="category-error" role="alert" className="mt-2 text-sm text-danger">
                  {visibleErrors.categoryId}
                </p>
              ) : null}
            </fieldset>
          </Card>

          <Card className="space-y-6 p-5 sm:p-6">
            <div id={FIELD_IDS.difficulty}>
            <SegmentedControl
              legend="Difficulty"
              name="difficulty"
              value={config.difficulty}
              onChange={(difficulty) => update({ difficulty })}
              error={category ? visibleErrors.difficulty : undefined}
              options={(["all", "easy", "medium", "hard"] as const).map((value) => {
                const count = category ? filterQuestions(categoryQuestions, category.id, value).length : null;
                const label = value === "all" ? "All difficulties" : DIFFICULTY_LABELS[value];
                return {
                  value,
                  label: (
                    <>
                      {label}
                      {count !== null ? <span className="ml-1.5 opacity-70 tabular-nums">{count}</span> : null}
                    </>
                  ),
                  ariaLabel: count !== null ? `${label}, ${count} questions` : label,
                };
              })}
            />
            </div>

            <div id={FIELD_IDS.questionCount}>
              <SegmentedControl
                legend="Number of questions"
                name="count"
                value={config.questionCount}
                onChange={(questionCount) => update({ questionCount })}
                error={category ? visibleErrors.questionCount : undefined}
                hint={
                  category
                    ? `${matchingCount} question${matchingCount === 1 ? "" : "s"} match this category and difficulty.`
                    : "Choose a category to see how many questions are available."
                }
                options={QUESTION_COUNT_CHOICES.map((value) => ({
                  value,
                  label: value === "all" ? `All${category ? ` (${matchingCount})` : ""}` : String(value),
                  ariaLabel: value === "all" ? "All matching questions" : `${value} questions`,
                }))}
              />
            </div>
          </Card>

          <Card className="space-y-6 p-5 sm:p-6">
            <Switch
              label="Timed quiz"
              description="A countdown runs for the whole quiz and submits automatically when time is up."
              checked={config.timed}
              onChange={(timed) => update({ timed })}
            />
            {config.timed ? (
              <div id={FIELD_IDS.timeLimitMinutes} className="animate-fade-in">
                <SegmentedControl
                  legend="Time limit"
                  name="time"
                  value={config.timeLimitMinutes}
                  onChange={(timeLimitMinutes) => update({ timeLimitMinutes })}
                  error={visibleErrors.timeLimitMinutes}
                  hint={
                    timingWarning ? (
                      <span className="inline-flex items-start gap-1.5 text-warning">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {timingWarning}
                      </span>
                    ) : questionCount ? (
                      `About ${Math.floor((config.timeLimitMinutes * 60) / questionCount)} seconds per question.`
                    ) : undefined
                  }
                  options={TIME_LIMIT_CHOICES.map((value) => ({ value, label: `${value} min`, ariaLabel: `${value} minutes` }))}
                />
              </div>
            ) : null}
            <div className="border-t border-border pt-6">
              <Switch
                label="Shuffle questions"
                description="Present the selected questions in a random order."
                checked={config.shuffleQuestions}
                onChange={(shuffleQuestions) => update({ shuffleQuestions })}
              />
            </div>
            <Switch
              label="Shuffle answer options"
              description="Randomize the order of the four options for each question."
              checked={config.shuffleOptions}
              onChange={(shuffleOptions) => update({ shuffleOptions })}
            />
          </Card>

          {/* Hidden submit so pressing Enter in the form starts the quiz. */}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>

        <aside className="lg:sticky lg:top-10">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-fg">Quiz summary</h2>
            <dl className="mt-3 divide-y divide-border">
              <SummaryRow label="Category">{category?.name ?? "Not selected"}</SummaryRow>
              <SummaryRow label="Difficulty">
                {config.difficulty === "all" ? "All difficulties" : DIFFICULTY_LABELS[config.difficulty]}
              </SummaryRow>
              <SummaryRow label="Questions">{questionCount ?? "—"}</SummaryRow>
              <SummaryRow label="Timer">{config.timed ? `${config.timeLimitMinutes} minutes` : "Untimed"}</SummaryRow>
              <SummaryRow label="Shuffle">
                {[config.shuffleQuestions && "Questions", config.shuffleOptions && "Options"].filter(Boolean).join(" & ") ||
                  "Off"}
              </SummaryRow>
            </dl>
            {!validation.ok && category && (errors.questionCount || errors.difficulty) ? (
              <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {errors.questionCount ?? errors.difficulty}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              <Button size="lg" fullWidth onClick={handleStart} disabled={starting}>
                <Play aria-hidden /> {starting ? "Starting…" : "Start quiz"}
              </Button>
              <ButtonLink href="/quizzes" variant="ghost" fullWidth>
                Cancel
              </ButtonLink>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Settings2 className="size-3.5" aria-hidden />
              Change defaults in{" "}
              <Link href="/settings" className="font-medium text-accent-text hover:underline">
                Settings
              </Link>
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
