"use client";

import { ClockFading, Compass, FilterX, Trash } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AttemptRow } from "@/components/quiz/attempt-row";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/form-controls";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { categories } from "@/data";
import { DIFFICULTY_LABELS, STATUS_LABELS } from "@/lib/quiz/format";
import {
  DEFAULT_HISTORY_FILTERS,
  filterAndSortHistory,
  getFinishedAttempts,
  type HistoryFilters,
  type HistorySort,
} from "@/lib/quiz/stats";
import { quizStore } from "@/lib/storage/store";
import { useQuizStore } from "@/lib/storage/use-quiz-store";

export function HistoryView() {
  const { ready, attempts } = useQuizStore();
  const toast = useToast();
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const [sort, setSort] = useState<HistorySort>("recent");
  const [confirmClear, setConfirmClear] = useState(false);

  if (!ready) return <LoadingState label="Loading your history…" />;

  const finished = getFinishedAttempts(attempts);
  const visible = filterAndSortHistory(attempts, filters, sort);
  const filtersActive =
    filters.categoryId !== "any" || filters.difficulty !== "any" || filters.status !== "any";

  function clearHistory() {
    const count = finished.length;
    const { persisted } = quizStore.clearHistory();
    setConfirmClear(false);
    setFilters(DEFAULT_HISTORY_FILTERS);
    toast(
      persisted
        ? { tone: "success", title: "History cleared", description: `Removed ${count} attempt${count === 1 ? "" : "s"}.` }
        : {
            tone: "warning",
            title: "History cleared for this visit",
            description: "This browser isn't allowing QuizCraft to update saved data, so old attempts may reappear later.",
          },
    );
  }

  return (
    <>
      <PageHeader
        title="Quiz history"
        description="Every quiz you finish in this browser, with scores and full answer reviews."
        actions={
          finished.length > 0 ? (
            <Button variant="secondary" onClick={() => setConfirmClear(true)}>
              <Trash aria-hidden className="text-danger" /> Clear history
            </Button>
          ) : null
        }
      />

      {finished.length === 0 ? (
        <EmptyState
          icon={<ClockFading />}
          title="No quiz history yet"
          description="Finish a quiz and it will appear here, so you can track your scores and review your answers any time."
          action={
            <ButtonLink href="/quizzes">
              <Compass aria-hidden /> Explore quizzes
            </ButtonLink>
          }
        />
      ) : (
        <>
          <Card className="mb-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              label="Category"
              value={filters.categoryId}
              onChange={(categoryId) => setFilters((current) => ({ ...current, categoryId }))}
              options={[
                { value: "any", label: "All categories" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
            <SelectField
              label="Difficulty"
              value={filters.difficulty}
              onChange={(difficulty) =>
                setFilters((current) => ({ ...current, difficulty: difficulty as HistoryFilters["difficulty"] }))
              }
              options={[
                { value: "any", label: "Any difficulty" },
                ...(["all", "easy", "medium", "hard"] as const).map((value) => ({
                  value,
                  label: DIFFICULTY_LABELS[value],
                })),
              ]}
            />
            <SelectField
              label="Status"
              value={filters.status}
              onChange={(status) => setFilters((current) => ({ ...current, status: status as HistoryFilters["status"] }))}
              options={[
                { value: "any", label: "Any status" },
                ...(["completed", "timed_out", "ended_early"] as const).map((value) => ({
                  value,
                  label: STATUS_LABELS[value],
                })),
              ]}
            />
            <SelectField
              label="Sort by"
              value={sort}
              onChange={(value) => setSort(value as HistorySort)}
              options={[
                { value: "recent", label: "Most recent" },
                { value: "highest", label: "Highest score" },
                { value: "lowest", label: "Lowest score" },
              ]}
            />
          </Card>

          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              Showing {visible.length} of {finished.length} attempt{finished.length === 1 ? "" : "s"}
            </p>
            {filtersActive ? (
              <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_HISTORY_FILTERS)}>
                Reset filters
              </Button>
            ) : null}
          </div>

          {visible.length > 0 ? (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-border">
                {visible.map((attempt) => (
                  <AttemptRow key={attempt.id} attempt={attempt} detailed />
                ))}
              </ul>
            </Card>
          ) : (
            <EmptyState
              icon={<FilterX />}
              title="No attempts match these filters"
              description="Try a different category, difficulty or status, or reset the filters to see all attempts."
              action={<Button onClick={() => setFilters(DEFAULT_HISTORY_FILTERS)}>Reset filters</Button>}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        icon={<Trash />}
        title="Clear all quiz history?"
        description={`This permanently deletes ${finished.length} finished attempt${
          finished.length === 1 ? "" : "s"
        } from this browser, including scores and answer reviews. This can't be undone. Quizzes still in progress are kept.`}
        confirmLabel="Clear history"
        onConfirm={clearHistory}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
