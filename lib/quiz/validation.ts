import { DIFFICULTIES, type QuizCategory, type QuizQuestion } from "@/types/quiz";

export interface QuestionProblem {
  questionId: string;
  problems: string[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Returns a list of human-readable problems with a single question (empty = valid). */
export function validateQuestion(question: QuizQuestion, categoryIds: ReadonlySet<string>): string[] {
  const problems: string[] = [];

  if (!isNonEmptyString(question.id)) problems.push("Missing id");
  if (!categoryIds.has(question.categoryId)) problems.push(`Unknown category "${question.categoryId}"`);
  if (!DIFFICULTIES.includes(question.difficulty)) problems.push("Invalid difficulty");
  if (!isNonEmptyString(question.prompt)) problems.push("Missing question text");
  if (!isNonEmptyString(question.explanation)) problems.push("Missing explanation");
  if (!isNonEmptyString(question.topic)) problems.push("Missing topic");

  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length !== 4) problems.push("Must have exactly four options");

  const optionIds = new Set<string>();
  for (const option of options) {
    if (!isNonEmptyString(option?.id) || !isNonEmptyString(option?.text)) {
      problems.push("Every option needs an id and text");
    }
    optionIds.add(option?.id);
  }
  if (optionIds.size !== options.length) problems.push("Option ids must be unique");
  if (!optionIds.has(question.correctOptionId)) problems.push("Correct option id is not one of the options");

  return problems;
}

/** Validates every question and checks that question ids are unique across the bank. */
export function validateQuestionBank(
  questions: readonly QuizQuestion[],
  categories: readonly QuizCategory[],
): QuestionProblem[] {
  const categoryIds = new Set(categories.map((category) => category.id));
  const seenIds = new Set<string>();
  const report: QuestionProblem[] = [];

  for (const question of questions) {
    const problems = validateQuestion(question, categoryIds);
    if (seenIds.has(question.id)) problems.push("Duplicate question id");
    seenIds.add(question.id);
    if (problems.length > 0) report.push({ questionId: question.id, problems });
  }

  return report;
}

/**
 * Drops invalid or duplicate questions so the app never serves a broken
 * question. Problems are logged in development to make them easy to fix.
 */
export function filterValidQuestions(
  questions: readonly QuizQuestion[],
  categories: readonly QuizCategory[],
): QuizQuestion[] {
  const categoryIds = new Set(categories.map((category) => category.id));
  const seenIds = new Set<string>();
  const valid: QuizQuestion[] = [];

  for (const question of questions) {
    const problems = validateQuestion(question, categoryIds);
    if (seenIds.has(question.id)) problems.push("Duplicate question id");
    seenIds.add(question.id);

    if (problems.length === 0) {
      valid.push(question);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(`[QuizCraft] Skipping question "${question.id}": ${problems.join("; ")}`);
    }
  }

  return valid;
}
