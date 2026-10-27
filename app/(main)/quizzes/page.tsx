import type { Metadata } from "next";
import { ExploreQuizzes } from "@/components/explore/explore-quizzes";

export const metadata: Metadata = { title: "Explore quizzes" };

export default function QuizzesPage() {
  return <ExploreQuizzes />;
}
