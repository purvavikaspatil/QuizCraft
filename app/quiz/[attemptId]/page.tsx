import type { Metadata } from "next";
import { Suspense } from "react";
import { ActiveQuiz } from "@/components/quiz/active-quiz";
import { QuizFrame } from "@/components/quiz/quiz-frame";
import { LoadingState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Quiz in progress" };

async function QuizFromParams({ params }: Pick<PageProps<"/quiz/[attemptId]">, "params">) {
  const { attemptId } = await params;
  return <ActiveQuiz attemptId={attemptId} />;
}

export default function QuizPage({ params }: PageProps<"/quiz/[attemptId]">) {
  return (
    <Suspense
      fallback={
        <QuizFrame>
          <LoadingState label="Loading your quiz…" />
        </QuizFrame>
      }
    >
      <QuizFromParams params={params} />
    </Suspense>
  );
}
