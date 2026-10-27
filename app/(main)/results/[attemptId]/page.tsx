import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultsView } from "@/components/results/results-view";
import { LoadingState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Quiz results" };

async function ResultsFromParams({ params }: Pick<PageProps<"/results/[attemptId]">, "params">) {
  const { attemptId } = await params;
  return <ResultsView attemptId={attemptId} />;
}

export default function ResultsPage({ params }: PageProps<"/results/[attemptId]">) {
  return (
    <Suspense fallback={<LoadingState label="Loading results…" />}>
      <ResultsFromParams params={params} />
    </Suspense>
  );
}
