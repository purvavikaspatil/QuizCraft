import { CircleCheck, CircleMinus, CircleX, CodeXml, FlaskConical, Globe, Hourglass, Flag, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS, STATUS_LABELS } from "@/lib/quiz/format";
import type { QuestionOutcome } from "@/lib/quiz/scoring";
import type { AttemptStatus, CategoryIcon as CategoryIconName, DifficultyFilter } from "@/types/quiz";

const CATEGORY_ICONS = { code: CodeXml, globe: Globe, flask: FlaskConical } as const;

export function CategoryIcon({ icon, className }: { icon: CategoryIconName; className?: string }) {
  const Icon = CATEGORY_ICONS[icon] ?? CodeXml;
  return <Icon className={className} aria-hidden />;
}

export function CategoryIconTile({ icon }: { icon: CategoryIconName }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text">
      <CategoryIcon icon={icon} className="size-5" />
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: DifficultyFilter }) {
  return <Badge tone="neutral">{DIFFICULTY_LABELS[difficulty]}</Badge>;
}

export function StatusBadge({ status }: { status: AttemptStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge tone="success" icon={<CircleCheck aria-hidden />}>
          {STATUS_LABELS[status]}
        </Badge>
      );
    case "timed_out":
      return (
        <Badge tone="warning" icon={<Hourglass aria-hidden />}>
          {STATUS_LABELS[status]}
        </Badge>
      );
    case "ended_early":
      return (
        <Badge tone="warning" icon={<Flag aria-hidden />}>
          {STATUS_LABELS[status]}
        </Badge>
      );
    case "in_progress":
      return (
        <Badge tone="accent" icon={<Play aria-hidden />}>
          {STATUS_LABELS[status]}
        </Badge>
      );
  }
}

export function OutcomeBadge({ outcome }: { outcome: QuestionOutcome }) {
  if (outcome === "correct") {
    return (
      <Badge tone="success" icon={<CircleCheck aria-hidden />}>
        Correct
      </Badge>
    );
  }
  if (outcome === "incorrect") {
    return (
      <Badge tone="danger" icon={<CircleX aria-hidden />}>
        Incorrect
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" icon={<CircleMinus aria-hidden />}>
      Unanswered
    </Badge>
  );
}
