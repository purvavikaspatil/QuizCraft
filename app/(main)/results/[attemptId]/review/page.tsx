import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewView } from "@/components/results/review-view";
import { LoadingState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Answer review" };

async function ReviewFromParams({ params }: Pick<PageProps<"/results/[attemptId]/review">, "params">) {
  const { attemptId } = await params;
  return <ReviewView attemptId={attemptId} />;
}

export default function ReviewPage({ params }: PageProps<"/results/[attemptId]/review">) {
  return (
    <Suspense fallback={<LoadingState label="Loading review…" />}>
      <ReviewFromParams params={params} />
    </Suspense>
  );
}
