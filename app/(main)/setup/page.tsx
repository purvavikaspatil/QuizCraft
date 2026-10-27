import type { Metadata } from "next";
import { Suspense } from "react";
import { QuizSetup } from "@/components/setup/quiz-setup";
import { LoadingState } from "@/components/ui/states";
import { getCategory } from "@/data";
import { isDifficultyFilter } from "@/lib/storage/schema";

export const metadata: Metadata = { title: "Quiz setup" };

async function SetupFromSearchParams({ searchParams }: Pick<PageProps<"/setup">, "searchParams">) {
  const params = await searchParams;
  // Values from the URL are untrusted; unknown values fall back to defaults.
  const category = typeof params.category === "string" && getCategory(params.category) ? params.category : null;
  const difficulty =
    typeof params.difficulty === "string" && isDifficultyFilter(params.difficulty) ? params.difficulty : null;
  return <QuizSetup initialCategoryId={category} initialDifficulty={difficulty} />;
}

export default function SetupPage({ searchParams }: PageProps<"/setup">) {
  return (
    <Suspense fallback={<LoadingState label="Loading quiz setup…" />}>
      <SetupFromSearchParams searchParams={searchParams} />
    </Suspense>
  );
}
