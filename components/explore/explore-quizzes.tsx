"use client";

import { Search, SearchX } from "lucide-react";
import { useId, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryCard } from "@/components/quiz/category-card";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/form-controls";
import { EmptyState } from "@/components/ui/states";
import { categories, questionBank } from "@/data";
import { DIFFICULTY_LABELS } from "@/lib/quiz/format";
import type { DifficultyFilter, QuizCategory, QuizQuestion } from "@/types/quiz";

interface ExploreResult {
  category: QuizCategory;
  questions: QuizQuestion[];
  /** Number of questions whose text or topic matched the search. */
  questionMatches: number;
}

function matchCategories(query: string, categoryId: string, difficulty: DifficultyFilter): ExploreResult[] {
  const needle = query.trim().toLowerCase();

  return categories
    .filter((category) => categoryId === "all" || category.id === categoryId)
    .map((category) => {
      const questions = questionBank.filter(
        (question) =>
          question.categoryId === category.id && (difficulty === "all" || question.difficulty === difficulty),
      );
      if (!needle) return { category, questions, questionMatches: 0 };

      const categoryMatches = [category.name, category.description, ...category.topics].some((text) =>
        text.toLowerCase().includes(needle),
      );
      const questionMatches = questions.filter(
        (question) =>
          question.prompt.toLowerCase().includes(needle) || question.topic.toLowerCase().includes(needle),
      ).length;
      return categoryMatches || questionMatches > 0 ? { category, questions, questionMatches } : null;
    })
    .filter((result): result is ExploreResult => result !== null && result.questions.length > 0);
}

export function ExploreQuizzes() {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");

  const results = matchCategories(query, categoryId, difficulty);
  const filtersActive = query.trim() !== "" || categoryId !== "all" || difficulty !== "all";
  const resetFilters = () => {
    setQuery("");
    setCategoryId("all");
    setDifficulty("all");
  };

  return (
    <>
      <PageHeader
        title="Explore quizzes"
        description="Browse categories, filter by difficulty, or search for a topic. Choose a category to set up your quiz."
      />

      <div className="mb-8 space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <div>
          <label htmlFor={searchId} className="mb-2 block text-sm font-medium text-fg">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “graphs”, “history” or “photosynthesis”"
              className="h-11 w-full rounded-xl border border-border bg-surface pr-3 pl-10 text-sm text-fg shadow-sm placeholder:text-muted hover:border-border-strong"
            />
          </div>
        </div>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
            <SegmentedControl
              legend="Category"
              value={categoryId}
              onChange={setCategoryId}
              options={[
                { value: "all", label: "All" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
            <SegmentedControl
              legend="Difficulty"
              value={difficulty}
              onChange={setDifficulty}
              options={(["all", "easy", "medium", "hard"] as const).map((value) => ({
                value,
                label: value === "all" ? "Any" : DIFFICULTY_LABELS[value],
              }))}
            />
          </div>
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {results.length === 0
          ? "No categories match your filters."
          : `Showing ${results.length} categor${results.length === 1 ? "y" : "ies"}`}
      </p>

      {results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map(({ category, questions, questionMatches }) => (
            <CategoryCard
              key={category.id}
              category={category}
              questions={questions}
              ctaLabel="Set up quiz"
              difficulty={difficulty}
              highlight={
                questionMatches > 0 ? (
                  <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent-text">
                    {questionMatches} question{questionMatches === 1 ? " mentions" : "s mention"} “{query.trim()}”
                  </p>
                ) : null
              }
              footer={category.topics.slice(0, 3).join(" · ")}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<SearchX />}
          title="No quizzes found"
          description="Nothing matches that combination. Try a different search term or clear the filters to see every category."
          action={<Button onClick={resetFilters}>Clear filters</Button>}
        />
      )}
    </>
  );
}
