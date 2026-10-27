"use client";

import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Compass,
  Flag,
  Hourglass,
  LogOut,
  SearchX,
  Send,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import {
  finalizeAttempt,
  getAnsweredCount,
  goToQuestion,
  selectAnswer,
  type AnswerRejection,
} from "@/lib/attempts/lifecycle";
import { cn } from "@/lib/cn";
import { DIFFICULTY_LABELS, formatClock } from "@/lib/quiz/format";
import { STORAGE_UNAVAILABLE_MESSAGE, quizStore } from "@/lib/storage/store";
import { useQuizStore } from "@/lib/storage/use-quiz-store";
import { useCountdown } from "@/lib/use-countdown";
import type { FinalAttemptStatus, QuizAttempt } from "@/types/quiz";
import { QuestionNavigator } from "./question-navigator";
import { QuizFrame } from "./quiz-frame";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function ActiveQuiz({ attemptId }: { attemptId: string }) {
  const { ready, attempts } = useQuizStore();
  // Set when this screen finalizes the attempt, so we show a transition instead
  // of the "already submitted" state while navigating to the results.
  const [leaving, setLeaving] = useState(false);
  const attempt = attempts.find((item) => item.id === attemptId);

  if (!ready || leaving) {
    return (
      <QuizFrame>
        <LoadingState label={leaving ? "Calculating your results…" : "Loading your quiz…"} />
      </QuizFrame>
    );
  }

  if (!attempt) {
    return (
      <QuizFrame>
        <ErrorState
          icon={<SearchX />}
          title="Quiz not found"
          description="This quiz attempt could not be found. It may have been started in another browser, or your browser data was cleared. Start a new quiz from Explore Quizzes."
          action={
            <ButtonLink href="/quizzes">
              <Compass aria-hidden /> Explore quizzes
            </ButtonLink>
          }
        />
      </QuizFrame>
    );
  }

  if (attempt.status !== "in_progress") {
    const timedOut = attempt.status === "timed_out";
    return (
      <QuizFrame>
        <ErrorState
          icon={timedOut ? <Hourglass /> : <CircleCheck />}
          title={timedOut ? "Time ran out on this quiz" : "This quiz has already been submitted"}
          description={
            timedOut
              ? "The timer reached zero, so the quiz was submitted with the answers you had selected. It can't be restarted, but you can review it or start a new attempt."
              : "Finished quizzes are read-only. You can view your results and review your answers, or start a new attempt."
          }
          action={
            <>
              <ButtonLink href={`/results/${attempt.id}`}>View results</ButtonLink>
              <ButtonLink href="/quizzes" variant="secondary">
                Explore quizzes
              </ButtonLink>
            </>
          }
        />
      </QuizFrame>
    );
  }

  return <QuizRunner attempt={attempt} onFinalized={() => setLeaving(true)} />;
}

function QuizRunner({ attempt, onFinalized }: { attempt: QuizAttempt; onFinalized: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const finalizingRef = useRef(false);
  const storageWarnedRef = useRef(false);
  const focusQuestionRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [dialog, setDialog] = useState<"submit" | "exit" | null>(null);

  const warnStorageOnce = useCallback(() => {
    if (storageWarnedRef.current) return;
    storageWarnedRef.current = true;
    toast({ tone: "warning", title: "Progress isn't being saved", description: STORAGE_UNAVAILABLE_MESSAGE });
  }, [toast]);

  /** Finalizes the attempt exactly once, then shows its results. */
  const finalize = useCallback(
    (status: FinalAttemptStatus) => {
      if (finalizingRef.current) return;
      finalizingRef.current = true;
      setDialog(null);

      const result = quizStore.updateAttempt(attempt.id, (current) => finalizeAttempt(current, status, Date.now()).attempt);
      onFinalized();
      if (result.changed && !result.persisted) {
        toast({ tone: "warning", title: "Result not saved", description: STORAGE_UNAVAILABLE_MESSAGE });
      }
      if (result.attempt?.status === "timed_out") {
        toast({ tone: "info", title: "Time's up!", description: "Your selected answers were submitted automatically." });
      }
      router.replace(`/results/${attempt.id}`);
    },
    [attempt.id, onFinalized, router, toast],
  );

  const remaining = useCountdown(attempt.deadline, () => finalize("timed_out"));

  const total = attempt.questions.length;
  const index = attempt.currentIndex;
  const question = attempt.questions[index];
  const selected = attempt.answers[question.questionId];
  const answered = getAnsweredCount(attempt);
  const unanswered = total - answered;
  const isLast = index === total - 1;
  const lowTime = remaining !== null && remaining <= 60_000;

  // Move focus to the new question after Previous/Next/navigator, for keyboard and screen-reader users.
  useEffect(() => {
    if (!focusQuestionRef.current) return;
    focusQuestionRef.current = false;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index]);

  function choose(optionId: string) {
    if (finalizingRef.current) return;
    const outcome: { rejection?: AnswerRejection } = {};
    const result = quizStore.updateAttempt(attempt.id, (current) => {
      const answer = selectAnswer(current, question.questionId, optionId, Date.now());
      if (!answer.ok) {
        outcome.rejection = answer.reason;
        return current;
      }
      return answer.attempt;
    });
    if (outcome.rejection === "expired") finalize("timed_out");
    else if (result.changed && !result.persisted) warnStorageOnce();
  }

  function go(target: number) {
    if (finalizingRef.current) return;
    focusQuestionRef.current = true;
    quizStore.updateAttempt(attempt.id, (current) => goToQuestion(current, target));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => setDialog("exit")} className="-ml-2" aria-label="Exit quiz">
            <LogOut aria-hidden /> <span className="hidden sm:inline">Exit quiz</span>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">
              {attempt.categoryName}
              <span className="font-normal text-muted"> · {DIFFICULTY_LABELS[attempt.config.difficulty]}</span>
            </p>
          </div>
          {remaining !== null ? (
            <div
              role="timer"
              aria-label={`Time remaining ${formatClock(remaining)}`}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold tabular-nums",
                lowTime ? "border-warning-border bg-warning-soft text-warning" : "border-border bg-surface-muted text-fg",
              )}
            >
              <Timer className="size-4" aria-hidden />
              {formatClock(remaining)}
            </div>
          ) : null}
          <Button size="sm" onClick={() => setDialog("submit")}>
            <Send aria-hidden /> Submit
          </Button>
        </div>
        <div className="mx-auto max-w-5xl px-4 pt-3 pb-3 sm:px-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
            <span>
              Question <span className="text-fg tabular-nums">{index + 1}</span> of <span className="tabular-nums">{total}</span>
            </span>
            <span className="tabular-nums">
              {answered} of {total} answered
            </span>
          </div>
          <ProgressBar value={index + 1} max={total} label={`Question ${index + 1} of ${total}`} />
        </div>
        <p className="sr-only" aria-live="polite">
          {lowTime ? "Less than one minute remaining." : ""}
        </p>
      </header>

      <main id="main" className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:py-10">
        <section aria-labelledby="question-heading">
          <Card key={question.questionId} className="animate-slide-up p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{question.topic}</Badge>
              <Badge>{DIFFICULTY_LABELS[question.difficulty]}</Badge>
            </div>
            <h1
              id="question-heading"
              ref={headingRef}
              tabIndex={-1}
              className="mt-4 scroll-mt-40 text-xl leading-snug font-semibold tracking-tight text-fg focus-visible:outline-none sm:text-2xl"
            >
              <span className="sr-only">Question {index + 1}: </span>
              {question.prompt}
            </h1>

            <fieldset className="mt-6">
              <legend className="sr-only">Choose one answer</legend>
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => {
                  const checked = selected === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-[border-color,background-color,box-shadow] duration-150",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                        checked
                          ? "border-accent bg-accent-soft shadow-sm"
                          : "border-border bg-surface hover:border-border-strong hover:bg-surface-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name={`answer-${question.questionId}`}
                        value={option.id}
                        aria-label={`${OPTION_LETTERS[optionIndex]}. ${option.text}`}
                        checked={checked}
                        onChange={() => choose(option.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold transition-colors",
                          checked ? "bg-accent text-accent-fg" : "bg-surface-muted text-muted",
                        )}
                      >
                        {OPTION_LETTERS[optionIndex]}
                      </span>
                      <span className="flex-1 text-[15px] leading-relaxed text-fg">{option.text}</span>
                      {checked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-text">
                          <CircleCheck className="size-4" aria-hidden />
                          <span className="hidden sm:inline">Selected</span>
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <p className="mt-4 text-xs text-muted">
              {selected ? "You can change your answer any time before submitting." : "Select an answer, or skip and come back later."}
            </p>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
              <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}>
                <ChevronLeft aria-hidden /> Previous
              </Button>
              {isLast ? (
                <Button onClick={() => setDialog("submit")}>
                  <Send aria-hidden /> Submit quiz
                </Button>
              ) : (
                <Button onClick={() => go(index + 1)}>
                  Next <ChevronRight aria-hidden />
                </Button>
              )}
            </div>
          </Card>
        </section>

        <aside>
          <Card className="p-5 lg:sticky lg:top-40">
            <h2 className="mb-4 text-sm font-semibold text-fg">Questions</h2>
            <QuestionNavigator attempt={attempt} onSelect={go} />
          </Card>
        </aside>
      </main>

      <ConfirmDialog
        open={dialog === "submit"}
        icon={<Send />}
        title={unanswered > 0 ? `Submit with ${unanswered} unanswered?` : "Submit your quiz?"}
        description={
          unanswered > 0
            ? `You've answered ${answered} of ${total} questions. Unanswered questions score zero. You won't be able to change answers after submitting.`
            : `You've answered all ${total} questions. You won't be able to change your answers after submitting.`
        }
        confirmLabel={unanswered > 0 ? "Submit anyway" : "Submit quiz"}
        cancelLabel="Return to quiz"
        onConfirm={() => finalize("completed")}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "exit"}
        tone="danger"
        icon={<Flag />}
        title="End this quiz early?"
        description={`This quiz is still in progress (${answered} of ${total} answered). Ending now saves it to your history as “Ended early”, and unanswered questions score zero.`}
        confirmLabel="End quiz"
        cancelLabel="Continue quiz"
        onConfirm={() => finalize("ended_early")}
        onCancel={() => setDialog(null)}
      >
        <div className="rounded-xl bg-surface-muted p-3 text-sm text-muted">
          Need a break instead?{" "}
          <button
            type="button"
            className="font-medium text-accent-text underline-offset-2 hover:underline"
            onClick={() => {
              setDialog(null);
              router.push("/");
            }}
          >
            Leave and resume later
          </button>
          . Your answers are saved in this browser
          {attempt.deadline !== null ? ", but the timer keeps running." : "."}
        </div>
      </ConfirmDialog>
    </div>
  );
}
