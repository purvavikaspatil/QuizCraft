import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { DIFFICULTY_LABELS } from "@/lib/quiz/format";
import { DIFFICULTIES, type DifficultyFilter, type QuizCategory, type QuizQuestion } from "@/types/quiz";
import { CategoryIconTile } from "./quiz-badges";

export function setupHref(categoryId: string, difficulty?: DifficultyFilter): string {
  const params = new URLSearchParams({ category: categoryId });
  if (difficulty && difficulty !== "all") params.set("difficulty", difficulty);
  return `/setup?${params.toString()}`;
}

/**
 * A category card. The whole card links to quiz setup; difficulty chips link to
 * setup with that difficulty preselected.
 */
export function CategoryCard({
  category,
  questions,
  ctaLabel = "Start quiz",
  footer,
  highlight,
  difficulty,
}: {
  category: QuizCategory;
  /** Difficulty to preselect when the card itself is clicked. */
  difficulty?: DifficultyFilter;
  /** Questions available in this category (already filtered as needed). */
  questions: readonly QuizQuestion[];
  ctaLabel?: string;
  footer?: ReactNode;
  highlight?: ReactNode;
}) {
  const counts = DIFFICULTIES.map((difficulty) => ({
    difficulty,
    count: questions.filter((question) => question.difficulty === difficulty).length,
  })).filter((item) => item.count > 0);

  return (
    <Card className="group relative flex flex-col p-5 transition-[border-color,box-shadow,transform] duration-200 focus-within:border-accent hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-raised)] motion-reduce:hover:translate-y-0">
      <div className="flex items-start gap-4">
        <CategoryIconTile icon={category.icon} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-fg">
            <Link
              href={setupHref(category.id, difficulty)}
              className="rounded after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none"
            >
              {category.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{category.description}</p>
        </div>
      </div>

      {highlight ? <div className="mt-4">{highlight}</div> : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-fg tabular-nums">
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </span>
        <span className="text-border-strong" aria-hidden>
          ·
        </span>
        {counts.map(({ difficulty, count }) => (
          <Link
            key={difficulty}
            href={setupHref(category.id, difficulty)}
            aria-label={`${category.name}, ${DIFFICULTY_LABELS[difficulty]}: ${count} questions`}
            className="relative z-10 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent-text"
          >
            {DIFFICULTY_LABELS[difficulty]} <span className="tabular-nums">{count}</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="min-w-0 text-xs text-muted">{footer}</div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-accent-text" aria-hidden>
          {ctaLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Card>
  );
}
