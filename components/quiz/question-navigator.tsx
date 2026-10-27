import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { QuizAttempt } from "@/types/quiz";

/** Jump-to-question grid. State is conveyed by text labels and icons, not only color. */
export function QuestionNavigator({
  attempt,
  onSelect,
}: {
  attempt: QuizAttempt;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Question navigator">
      <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-5">
        {attempt.questions.map((question, index) => {
          const answered = attempt.answers[question.questionId] !== undefined;
          const current = index === attempt.currentIndex;
          return (
            <li key={question.questionId}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={current ? "step" : undefined}
                aria-label={`Question ${index + 1}, ${answered ? "answered" : "not answered"}${current ? ", current" : ""}`}
                className={cn(
                  "relative grid h-10 w-full place-items-center rounded-lg border text-sm font-medium tabular-nums transition-colors",
                  answered
                    ? "border-transparent bg-accent-soft text-accent-text hover:bg-accent-soft-strong"
                    : "border-dashed border-border-strong bg-surface text-muted hover:border-accent hover:text-fg",
                  current && "border-solid border-accent ring-2 ring-accent ring-offset-2 ring-offset-surface",
                )}
              >
                {index + 1}
                {answered ? (
                  <Check className="absolute top-0.5 right-0.5 size-3" strokeWidth={3} aria-hidden />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
      <ul className="mt-4 space-y-1.5 text-xs text-muted">
        <li className="flex items-center gap-2">
          <span className="relative grid size-4 place-items-center rounded bg-accent-soft text-accent-text" aria-hidden>
            <Check className="size-2.5" strokeWidth={3} />
          </span>
          Answered
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded border border-dashed border-border-strong" aria-hidden />
          Not answered
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded ring-2 ring-accent" aria-hidden />
          Current question
        </li>
      </ul>
    </nav>
  );
}
