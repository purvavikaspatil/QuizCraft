import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getCategory } from "@/data";
import { cn } from "@/lib/cn";
import { formatDateTime, formatDuration } from "@/lib/quiz/format";
import { getTimeTakenMs, scoreAttempt } from "@/lib/quiz/scoring";
import type { QuizAttempt } from "@/types/quiz";
import { CategoryIconTile, DifficultyBadge, StatusBadge } from "./quiz-badges";

function scoreTone(percentage: number): string {
  if (percentage >= 75) return "text-success";
  if (percentage >= 50) return "text-fg";
  return "text-warning";
}

/** One finished attempt in a list. Used by the dashboard and history page. */
export function AttemptRow({ attempt, detailed = false }: { attempt: QuizAttempt; detailed?: boolean }) {
  const result = scoreAttempt(attempt);
  const icon = getCategory(attempt.config.categoryId)?.icon ?? "code";
  const finishedAt = attempt.finishedAt ?? attempt.startedAt;

  return (
    <li className="relative flex flex-col gap-3 p-4 transition-colors hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CategoryIconTile icon={icon} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-medium text-fg">
              <Link
                href={`/results/${attempt.id}`}
                className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                {attempt.categoryName}
                <span className="sr-only">, view results</span>
              </Link>
            </h3>
            <DifficultyBadge difficulty={attempt.config.difficulty} />
            {detailed || attempt.status !== "completed" ? <StatusBadge status={attempt.status} /> : null}
          </div>
          <p className="mt-1 text-xs text-muted">
            {formatDateTime(finishedAt)}
            {detailed ? (
              <>
                {" · "}
                {result.total} questions{" · "}
                {formatDuration(getTimeTakenMs(attempt))}
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pl-14 sm:pl-0">
        <div className="text-right">
          <p className={cn("text-lg font-semibold tabular-nums", scoreTone(result.percentage))}>{result.percentage}%</p>
          <p className="text-xs text-muted tabular-nums">
            {result.correct}/{result.total} correct
          </p>
        </div>
        {detailed ? (
          <Link
            href={`/results/${attempt.id}/review`}
            className="relative z-10 rounded-lg px-2 py-1 text-sm font-medium text-accent-text hover:bg-accent-soft"
          >
            Review<span className="sr-only"> answers for {attempt.categoryName}</span>
          </Link>
        ) : null}
        <ChevronRight className="size-5 text-muted" aria-hidden />
      </div>
    </li>
  );
}
