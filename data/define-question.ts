import type { Difficulty, QuizQuestion } from "@/types/quiz";

const OPTION_IDS = ["a", "b", "c", "d"] as const;

interface QuestionInput {
  id: string;
  difficulty: Difficulty;
  topic: string;
  prompt: string;
  options: readonly [string, string, string, string];
  /** Index (0-3) of the correct option in `options` as written. */
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}

/**
 * Builds a question with stable option IDs ("a"–"d") so the correct answer is
 * identified by ID rather than by display position.
 */
export function defineQuestions(
  categoryId: string,
  inputs: readonly QuestionInput[],
): QuizQuestion[] {
  return inputs.map((input) => ({
    id: input.id,
    categoryId,
    difficulty: input.difficulty,
    topic: input.topic,
    prompt: input.prompt,
    options: input.options.map((text, index) => ({ id: OPTION_IDS[index], text })),
    correctOptionId: OPTION_IDS[input.answer],
    explanation: input.explanation,
  }));
}
