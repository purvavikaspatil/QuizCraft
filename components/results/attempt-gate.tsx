"use client";

import { Compass, Play, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useQuizStore } from "@/lib/storage/use-quiz-store";
import type { QuizAttempt } from "@/types/quiz";

/**
 * Loads a finished attempt by id and handles the loading, missing and
 * still-in-progress cases shared by the results and review screens.
 */
export function FinishedAttemptGate({
  attemptId,
  children,
}: {
  attemptId: string;
  children: (attempt: QuizAttempt) => ReactNode;
}) {
  const { ready, attempts } = useQuizStore();
  if (!ready) return <LoadingState label="Loading results…" />;

  const attempt = attempts.find((item) => item.id === attemptId);
  if (!attempt) {
    return (
      <ErrorState
        icon={<SearchX />}
        title="Results not found"
        description="This quiz attempt could not be found. It may have been cleared from your history or saved in a different browser. Start a new quiz from Explore Quizzes."
        action={
          <>
            <ButtonLink href="/quizzes">
              <Compass aria-hidden /> Explore quizzes
            </ButtonLink>
            <ButtonLink href="/history" variant="secondary">
              View history
            </ButtonLink>
          </>
        }
      />
    );
  }

  if (attempt.status === "in_progress") {
    return (
      <ErrorState
        icon={<Play />}
        title="This quiz is still in progress"
        description="Results are available once the quiz is submitted. Resume where you left off to finish it."
        action={<ButtonLink href={`/quiz/${attempt.id}`}>Resume quiz</ButtonLink>}
      />
    );
  }

  return <>{children(attempt)}</>;
}
