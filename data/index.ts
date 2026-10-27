import { filterValidQuestions } from "@/lib/quiz/validation";
import type { QuizCategory, QuizQuestion } from "@/types/quiz";
import { generalKnowledgeQuestions } from "./questions/general-knowledge";
import { programmingQuestions } from "./questions/programming";
import { scienceQuestions } from "./questions/science";

export const categories: QuizCategory[] = [
  {
    id: "programming",
    name: "Programming",
    description: "Fundamentals, data structures, algorithms and core computer science.",
    icon: "code",
    topics: ["Algorithms", "Data structures", "Complexity", "Graphs", "Web"],
  },
  {
    id: "general-knowledge",
    name: "General Knowledge",
    description: "Geography, history, languages and facts about the world around you.",
    icon: "globe",
    topics: ["Geography", "History", "Languages", "Astronomy"],
  },
  {
    id: "science",
    name: "Science",
    description: "Essential physics, chemistry and biology concepts.",
    icon: "flask",
    topics: ["Physics", "Chemistry", "Biology"],
  },
];

/**
 * The full question bank. Questions that fail structural validation are
 * excluded so the UI never offers a quiz built on a broken question.
 */
export const questionBank: QuizQuestion[] = filterValidQuestions(
  [...programmingQuestions, ...generalKnowledgeQuestions, ...scienceQuestions],
  categories,
);

export function getCategory(categoryId: string): QuizCategory | undefined {
  return categories.find((category) => category.id === categoryId);
}
