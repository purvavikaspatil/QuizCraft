import { Compass, LayoutDashboard, SearchX } from "lucide-react";
import { QuizFrame } from "@/components/quiz/quiz-frame";
import { ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

export default function NotFound() {
  return (
    <QuizFrame>
      <ErrorState
        icon={<SearchX />}
        title="Page not found"
        description="The page you're looking for doesn't exist. Head back to your dashboard or explore the available quizzes."
        action={
          <>
            <ButtonLink href="/">
              <LayoutDashboard aria-hidden /> Dashboard
            </ButtonLink>
            <ButtonLink href="/quizzes" variant="secondary">
              <Compass aria-hidden /> Explore quizzes
            </ButtonLink>
          </>
        }
      />
    </QuizFrame>
  );
}
