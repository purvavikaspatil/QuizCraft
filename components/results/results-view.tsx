"use client";

import {
  BookOpen,
  CalendarClock,
  CircleCheck,
  CircleMinus,
  CircleX,
  ClockFading,
  Compass,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { CategoryIcon, DifficultyBadge, StatusBadge } from "@/components/quiz/quiz-badges";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { getCategory } from "@/data";
import { createRetryAttempt } from "@/lib/attempts/lifecycle";
import { formatDateTime, formatDuration, getScoreFeedback } from "@/lib/quiz/format";
import { getTimeTakenMs, scoreAttempt } from "@/lib/quiz/scoring";
import { STORAGE_UNAVAILABLE_MESSAGE, quizStore } from "@/lib/storage/store";
import type { QuizAttempt } from "@/types/quiz";
import { FinishedAttemptGate } from "./attempt-gate";

const HEADINGS = {
  completed: "Quiz completed!",
  timed_out: "Time's up!",
  ended_early: "Quiz ended early",
} as const;

function CountTile({ icon, label, value, className }: { icon: ReactNode; label: string; value: number; className: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className={`flex items-center gap-1.5 text-sm font-medium [&_svg]:size-4 ${className}`}>
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-fg tabular-nums">{value}</p>
    </div>
  );
}

export function ResultsView({ attemptId }: { attemptId: string }) {
  return <FinishedAttemptGate attemptId={attemptId}>{(attempt) => <Results attempt={attempt} />}</FinishedAttemptGate>;
}

function Results({ attempt }: { attempt: QuizAttempt }) {
  const router = useRouter();
  const toast = useToast();
  const retryingRef = useRef(false);
  const [retrying, setRetrying] = useState(false);

  const result = scoreAttempt(attempt);
  const status = attempt.status === "in_progress" ? "completed" : attempt.status;
  const icon = getCategory(attempt.config.categoryId)?.icon ?? "code";

  function retry() {
    if (retryingRef.current) return;
    retryingRef.current = true;
    setRetrying(true);

    const created = createRetryAttempt(attempt);
    if (!created.ok) {
      retryingRef.current = false;
      setRetrying(false);
      toast({
        tone: "error",
        title: "This quiz can't be retried as-is",
        description: "The available questions have changed. Set up a new quiz from Explore Quizzes instead.",
      });
      return;
    }
    if (!quizStore.saveAttempt(created.attempt).persisted) {
      toast({ tone: "warning", title: "Progress won't be saved", description: STORAGE_UNAVAILABLE_MESSAGE });
    }
    router.push(`/quiz/${created.attempt.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-8 p-6 sm:p-10 md:flex-row md:items-center">
          <ScoreRing percentage={result.percentage} />
          <div className="min-w-0 flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <StatusBadge status={status} />
              <DifficultyBadge difficulty={attempt.config.difficulty} />
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg">{HEADINGS[status]}</h1>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-muted">
              <CategoryIcon icon={icon} className="size-4 text-accent-text" />
              {attempt.categoryName} · {result.correct} of {result.total} correct
            </p>
            <p className="mt-3 text-base leading-relaxed text-fg">{getScoreFeedback(result.percentage)}</p>
            {status === "timed_out" ? (
              <p className="mt-2 text-sm text-muted">The timer ran out, so your quiz was submitted automatically with the answers you had selected.</p>
            ) : null}
            {status === "ended_early" ? (
              <p className="mt-2 text-sm text-muted">You ended this quiz before submitting. Unanswered questions scored zero.</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border bg-surface-muted/50 p-6 sm:grid-cols-4 sm:p-8">
          <CountTile icon={<CircleCheck aria-hidden />} label="Correct" value={result.correct} className="text-success" />
          <CountTile icon={<CircleX aria-hidden />} label="Incorrect" value={result.incorrect} className="text-danger" />
          <CountTile icon={<CircleMinus aria-hidden />} label="Unanswered" value={result.unanswered} className="text-muted" />
          <CountTile icon={<ListChecks aria-hidden />} label="Total" value={result.total} className="text-accent-text" />
        </div>

        <dl className="grid gap-4 border-t border-border p-6 text-sm sm:grid-cols-3 sm:p-8">
          <div className="flex items-center gap-3">
            <Timer className="size-5 text-muted" aria-hidden />
            <div>
              <dt className="text-muted">Time taken</dt>
              <dd className="font-medium text-fg">
                {formatDuration(getTimeTakenMs(attempt))}
                {attempt.config.timed ? <span className="text-muted"> of {attempt.config.timeLimitMinutes} min</span> : null}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarClock className="size-5 text-muted" aria-hidden />
            <div>
              <dt className="text-muted">Finished</dt>
              <dd className="font-medium text-fg">{formatDateTime(attempt.finishedAt ?? attempt.startedAt)}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ListChecks className="size-5 text-muted" aria-hidden />
            <div>
              <dt className="text-muted">Mode</dt>
              <dd className="font-medium text-fg">{attempt.config.timed ? "Timed" : "Untimed"}</dd>
            </div>
          </div>
        </dl>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ButtonLink href={`/results/${attempt.id}/review`} size="lg">
          <BookOpen aria-hidden /> Review answers
        </ButtonLink>
        <Button size="lg" variant="soft" onClick={retry} disabled={retrying}>
          <RotateCcw aria-hidden /> {retrying ? "Starting…" : "Retry quiz"}
        </Button>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <ButtonLink href="/quizzes" variant="secondary">
            <Compass aria-hidden /> Explore other quizzes
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            <LayoutDashboard aria-hidden /> Dashboard
          </ButtonLink>
          <ButtonLink href="/history" variant="ghost">
            <ClockFading aria-hidden /> View history
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
