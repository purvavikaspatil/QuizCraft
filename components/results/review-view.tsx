"use client";

import { ArrowLeft, ArrowUp, CircleCheck, CircleX, Lightbulb, SearchX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { OutcomeBadge } from "@/components/quiz/quiz-badges";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/form-controls";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { DIFFICULTY_LABELS } from "@/lib/quiz/format";
import { getQuestionOutcome, scoreAttempt, type QuestionOutcome } from "@/lib/quiz/scoring";
import type { AttemptQuestion, QuizAttempt } from "@/types/quiz";
import { FinishedAttemptGate } from "./attempt-gate";

type ReviewFilter = "all" | QuestionOutcome;

const OPTION_LETTERS = ["A", "B", "C", "D"];

const CARD_ACCENT: Record<QuestionOutcome, string> = {
  correct: "border-l-success",
  incorrect: "border-l-danger",
  unanswered: "border-l-border-strong",
};

export function ReviewView({ attemptId }: { attemptId: string }) {
  return <FinishedAttemptGate attemptId={attemptId}>{(attempt) => <Review attempt={attempt} />}</FinishedAttemptGate>;
}

interface ReviewItem {
  number: number;
  question: AttemptQuestion;
  selected: string | undefined;
  outcome: QuestionOutcome;
}

function Review({ attempt }: { attempt: QuizAttempt }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const result = scoreAttempt(attempt);

  // Read-only: derived from the stored attempt, never written back.
  const items: ReviewItem[] = attempt.questions.map((question, index) => {
    const selected = attempt.answers[question.questionId];
    return { number: index + 1, question, selected, outcome: getQuestionOutcome(question, selected) };
  });
  const visible = filter === "all" ? items : items.filter((item) => item.outcome === filter);

  const counts: Record<ReviewFilter, number> = {
    all: items.length,
    incorrect: result.incorrect,
    unanswered: result.unanswered,
    correct: result.correct,
  };
  const filterLabels: Record<ReviewFilter, string> = {
    all: "All",
    incorrect: "Incorrect",
    unanswered: "Unanswered",
    correct: "Correct",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={
          <Link href={`/results/${attempt.id}`} className="inline-flex items-center gap-1 rounded hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> Back to results
          </Link>
        }
        title="Answer review"
        description={`${attempt.categoryName} · ${DIFFICULTY_LABELS[attempt.config.difficulty]} · ${result.correct} of ${result.total} correct (${result.percentage}%)`}
      />

      <Card className="mb-6 p-5">
        <SegmentedControl
          legend="Show questions"
          value={filter}
          onChange={setFilter}
          options={(["all", "incorrect", "unanswered", "correct"] as const).map((value) => ({
            value,
            label: (
              <>
                {filterLabels[value]}
                <span className="ml-1.5 opacity-70 tabular-nums">{counts[value]}</span>
              </>
            ),
            ariaLabel: `${filterLabels[value]}, ${counts[value]} questions`,
          }))}
        />
        {visible.length > 1 ? (
          <nav aria-label="Jump to question" className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Jump to question</p>
            <ol className="flex flex-wrap gap-2">
              {visible.map((item) => (
                <li key={item.question.questionId}>
                  <a
                    href={`#review-q${item.number}`}
                    aria-label={`Question ${item.number}, ${item.outcome}`}
                    className={cn(
                      "grid size-9 place-items-center rounded-lg border text-sm font-medium tabular-nums transition-colors",
                      item.outcome === "correct" && "border-success-border bg-success-soft text-success",
                      item.outcome === "incorrect" && "border-danger-border bg-danger-soft text-danger",
                      item.outcome === "unanswered" && "border-dashed border-border-strong text-muted",
                    )}
                  >
                    {item.number}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </Card>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} {filter === "all" ? "" : filterLabels[filter].toLowerCase()} question
        {visible.length === 1 ? "" : "s"}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={filter === "incorrect" ? <CircleCheck /> : <SearchX />}
          title={
            filter === "incorrect"
              ? "No incorrect answers"
              : filter === "unanswered"
                ? "Every question was answered"
                : "No correct answers this time"
          }
          description={
            filter === "correct"
              ? "Read through the explanations for the other questions, then retry the quiz."
              : "Nothing to show for this filter. Switch filters to review the other questions."
          }
          action={<Button onClick={() => setFilter("all")}>Show all questions</Button>}
        />
      ) : (
        <ol className="space-y-4">
          {visible.map((item) => (
            <li key={item.question.questionId} id={`review-q${item.number}`} className="scroll-mt-24">
              <ReviewCard item={item} />
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <ButtonLink href={`/results/${attempt.id}`} variant="secondary">
          <ArrowLeft aria-hidden /> Back to results
        </ButtonLink>
        <ButtonLink href="#main" variant="ghost">
          <ArrowUp aria-hidden /> Back to top
        </ButtonLink>
      </div>
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const { question, selected, outcome, number } = item;

  return (
    <Card className={cn("border-l-4 p-5 sm:p-6", CARD_ACCENT[outcome])}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted">Question {number}</span>
        <OutcomeBadge outcome={outcome} />
        <span className="text-xs text-muted">
          {question.topic} · {DIFFICULTY_LABELS[question.difficulty]}
        </span>
      </div>
      <h2 className="mt-3 text-lg leading-snug font-semibold text-fg">{question.prompt}</h2>

      <ul className="mt-4 space-y-2" aria-label="Answer options">
        {question.options.map((option, index) => {
          const isCorrect = option.id === question.correctOptionId;
          const isSelected = option.id === selected;
          return (
            <li
              key={option.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-sm",
                isCorrect && "border-success-border bg-success-soft",
                isSelected && !isCorrect && "border-danger-border bg-danger-soft",
                !isCorrect && !isSelected && "border-border",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold",
                  isCorrect ? "bg-success text-white dark:text-[#06210f]" : isSelected ? "bg-danger text-white dark:text-[#1a0b0b]" : "bg-surface-muted text-muted",
                )}
              >
                {OPTION_LETTERS[index]}
              </span>
              <span className="flex-1 pt-0.5 text-fg">{option.text}</span>
              <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5 text-xs font-semibold">
                {isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CircleCheck className="size-3.5" aria-hidden /> Correct answer
                  </span>
                ) : null}
                {isSelected ? (
                  <span className={cn("inline-flex items-center gap-1", isCorrect ? "text-success" : "text-danger")}>
                    {isCorrect ? null : <CircleX className="size-3.5" aria-hidden />} Your answer
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>

      {outcome === "unanswered" ? (
        <p className="mt-3 text-sm text-muted">You didn&apos;t answer this question.</p>
      ) : null}

      <div className="mt-4 flex gap-3 rounded-xl bg-accent-soft/60 p-4 text-sm leading-relaxed text-fg">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
        <p>
          <span className="font-semibold">Explanation. </span>
          {question.explanation}
        </p>
      </div>
    </Card>
  );
}
