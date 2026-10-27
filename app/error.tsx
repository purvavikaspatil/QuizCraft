"use client";

import { LayoutDashboard, RotateCcw, TriangleAlert } from "lucide-react";
import { QuizFrame } from "@/components/quiz/quiz-frame";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

/** Friendly fallback for unexpected errors. Technical details stay in the console. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <QuizFrame>
      <ErrorState
        icon={<TriangleAlert />}
        title="Something went wrong"
        description="QuizCraft hit an unexpected problem while showing this page. Your saved history is safe. Try again, or return to the dashboard."
        action={
          <>
            <Button onClick={reset}>
              <RotateCcw aria-hidden /> Try again
            </Button>
            <ButtonLink href="/" variant="secondary">
              <LayoutDashboard aria-hidden /> Dashboard
            </ButtonLink>
          </>
        }
      />
    </QuizFrame>
  );
}
