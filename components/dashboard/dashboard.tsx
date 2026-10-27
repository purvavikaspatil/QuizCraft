"use client";

import { ArrowRight, CircleCheck, ClockFading, Compass, Play, Sparkles, Target, Timer, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AttemptRow } from "@/components/quiz/attempt-row";
import { CategoryCard } from "@/components/quiz/category-card";
import { CategoryIconTile, DifficultyBadge } from "@/components/quiz/quiz-badges";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { categories, getCategory, questionBank } from "@/data";
import { getAnsweredCount, getRemainingMs } from "@/lib/attempts/lifecycle";
import { formatClock, formatDateTime } from "@/lib/quiz/format";
import { scoreAttempt } from "@/lib/quiz/scoring";
import { computeDashboardStats, getFinishedAttempts, getInProgressAttempts } from "@/lib/quiz/stats";
import { useQuizStore } from "@/lib/storage/use-quiz-store";
import { useNow } from "@/lib/use-now";
import type { QuizAttempt } from "@/types/quiz";

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-accent-text">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-fg tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  );
}

function ResumeCard({ attempt }: { attempt: QuizAttempt }) {
  const now = useNow(1000, attempt.deadline !== null);
  const answered = getAnsweredCount(attempt);
  const remaining = getRemainingMs(attempt, now);
  const icon = getCategory(attempt.config.categoryId)?.icon ?? "code";

  return (
    <Card className="flex flex-col gap-4 border-accent/40 bg-accent-soft/40 p-5 sm:flex-row sm:items-center">
      <CategoryIconTile icon={icon} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-fg">{attempt.categoryName} quiz in progress</p>
          <DifficultyBadge difficulty={attempt.config.difficulty} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {answered} of {attempt.questions.length} answered · started {formatDateTime(attempt.startedAt)}
          {remaining !== null ? (
            <span className="inline-flex items-center gap-1">
              {" · "}
              <Timer className="size-3.5" aria-hidden /> {formatClock(remaining)} left
            </span>
          ) : null}
        </p>
        <div className="mt-3 max-w-sm">
          <ProgressBar value={answered} max={attempt.questions.length} label="Questions answered" />
        </div>
      </div>
      <ButtonLink href={`/quiz/${attempt.id}`}>
        <Play aria-hidden /> Resume quiz
      </ButtonLink>
    </Card>
  );
}

export function Dashboard() {
  const { ready, attempts } = useQuizStore();

  if (!ready) return <LoadingState label="Loading your progress…" />;

  const finished = getFinishedAttempts(attempts);
  const inProgress = getInProgressAttempts(attempts);
  const stats = computeDashboardStats(attempts);
  const recent = finished.slice(0, 5);
  const hasHistory = finished.length > 0;

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-4" aria-hidden /> Welcome to QuizCraft
          </span>
        }
        title="Ready to test your knowledge?"
        description={
          hasHistory
            ? "Pick up where you left off, or try a new category. Every quiz you finish is saved here so you can track your progress."
            : "Choose a category, set up a quiz that fits your schedule, and learn from detailed explanations after every attempt."
        }
        actions={
          <ButtonLink href="/quizzes" size="lg">
            <Compass aria-hidden /> Explore quizzes
          </ButtonLink>
        }
      />

      {inProgress.length > 0 ? (
        <section aria-labelledby="in-progress-heading" className="mb-10">
          <h2 id="in-progress-heading" className="sr-only">
            Quizzes in progress
          </h2>
          <div className="space-y-3">
            {inProgress.map((attempt) => (
              <ResumeCard key={attempt.id} attempt={attempt} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="stats-heading" className="mb-10">
        <h2 id="stats-heading" className="sr-only">
          Your statistics
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            icon={<CircleCheck aria-hidden />}
            label="Quizzes completed"
            value={String(stats.attemptCount)}
            hint={hasHistory ? "Finished attempts saved here" : "Finish a quiz to start tracking"}
          />
          <StatCard
            icon={<Target aria-hidden />}
            label="Average score"
            value={stats.averagePercentage === null ? "—" : `${stats.averagePercentage}%`}
            hint={hasHistory ? "Across all finished attempts" : "No attempts yet"}
          />
          <StatCard
            icon={<Trophy aria-hidden />}
            label="Best score"
            value={stats.bestPercentage === null ? "—" : `${stats.bestPercentage}%`}
            hint={hasHistory ? "Your personal best" : "No attempts yet"}
          />
          <StatCard
            icon={<Sparkles aria-hidden />}
            label="Correct answers"
            value={String(stats.totalCorrect)}
            hint={hasHistory ? `Out of ${stats.totalQuestions} questions attempted` : "No questions answered yet"}
          />
        </div>
      </section>

      <section aria-labelledby="practice-heading" className="mb-10">
        <SectionHeading
          id="practice-heading"
          title="Continue practicing"
          description="Choose a category to configure your next quiz."
          action={
            <ButtonLink href="/quizzes" variant="ghost" size="sm">
              Browse all <ArrowRight aria-hidden />
            </ButtonLink>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const last = finished.find((attempt) => attempt.config.categoryId === category.id);
            return (
              <CategoryCard
                key={category.id}
                category={category}
                questions={questionBank.filter((question) => question.categoryId === category.id)}
                footer={
                  last
                    ? `Last score ${scoreAttempt(last).percentage}% · ${formatDateTime(last.finishedAt ?? last.startedAt)}`
                    : "Not attempted yet"
                }
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <SectionHeading
          id="recent-heading"
          title="Recent activity"
          description={hasHistory ? "Your latest finished quizzes." : undefined}
          action={
            hasHistory ? (
              <ButtonLink href="/history" variant="ghost" size="sm">
                View all history <ArrowRight aria-hidden />
              </ButtonLink>
            ) : null
          }
        />
        {hasHistory ? (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {recent.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState
            icon={<ClockFading />}
            title="No quizzes yet"
            description="Your finished quizzes will appear here with scores and a full answer review."
            action={
              <ButtonLink href="/quizzes">
                <Compass aria-hidden /> Explore quizzes
              </ButtonLink>
            }
          />
        )}
      </section>
    </>
  );
}
