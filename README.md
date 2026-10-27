# QuizCraft

QuizCraft is a quiz practice app for students. Pick a category, set up a quiz that fits your time, answer questions one at a time, then review every answer with an explanation. Your scores and history are saved in your browser so you can track progress over time.

## The problem it solves

Plenty of quiz tools give you a score and stop there. QuizCraft is built around **learning from mistakes**. Every attempt is stored with a snapshot of the exact questions and options you saw, so you can come back later, filter to the questions you got wrong or skipped, and read why the correct answer is correct.

## Features

- **Dashboard**: statistics calculated from your saved attempts (quizzes completed, average score, best score, correct answers), a "resume" card for unfinished quizzes, category cards and recent activity. A new install shows zeros and empty states, never invented numbers.
- **Explore quizzes**: search by category, topic or question text; filter by category and difficulty; clear filters in one click.
- **Quiz setup**: category, difficulty (All/Easy/Medium/Hard), question count (5/10/15/All), timed or untimed (5–30 min), shuffle questions, shuffle answer options. Validation runs live (e.g. *"Only 5 questions match these filters. Choose a smaller quiz size or change the difficulty."*), and you get a warning when the time limit is tight.
- **Active quiz**: one question per screen, full-width selectable options, Previous/Next, a question navigator (current/answered/unanswered, conveyed with icons and labels as well as color), a progress bar, an answered count and a countdown timer.
- **Submit and end early**: both use confirmation dialogs. Unanswered questions are counted and shown before you submit.
- **Results**: score ring, correct/incorrect/unanswered/total, time taken, completion status, and feedback based on your actual score. Actions: Review answers, Retry quiz, Explore, Dashboard, History.
- **Answer review**: every question with your answer, the correct answer, an outcome label and the explanation. Filters for All, Incorrect, Unanswered and Correct, plus jump links. Review is read-only.
- **History**: filter by category, difficulty and status; sort by most recent, highest or lowest score; Clear History with a confirmation dialog.
- **Settings**: Light/Dark/System theme (no flash of the wrong theme on load), quiz defaults, shuffle preferences, and Reset Preferences.
- **Accessibility**: semantic headings, labelled controls, native radio groups (arrow-key navigation), native `<dialog>` (focus trap, Escape to close), visible focus rings, a skip link, `prefers-reduced-motion` support, and states that never rely on color alone.
- **Responsive**: sidebar on desktop, collapsible menu on mobile, no horizontal scrolling at 375 px.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with CSS-variable design tokens |
| Icons | lucide-react |
| Persistence | Browser `localStorage` behind a validated repository |
| Tests | Vitest |

There is no backend, database, authentication, API key or external service. Once the page has loaded, everything runs in the browser.

## Architecture

```
app/
  layout.tsx               Root layout: fonts, no-flash theme script, toasts
  (main)/                  Pages that use the sidebar shell
    page.tsx               /                     Dashboard
    quizzes/page.tsx       /quizzes              Explore
    setup/page.tsx         /setup?category=…     Quiz setup
    results/[attemptId]/   /results/:id          Results  (+ /review)
    history/page.tsx       /history
    settings/page.tsx      /settings
  quiz/[attemptId]/        /quiz/:id             Focused active-quiz screen (no sidebar)
  not-found.tsx, error.tsx Friendly fallbacks (no stack traces)
components/
  ui/                      Button, Card, Badge, ConfirmDialog, Toast, form controls, progress, states
  layout/                  App shell, navigation, theme toggle, theme/notice effects
  quiz/                    Active quiz, navigator, category card, attempt row, badges
  dashboard/ explore/ setup/ results/ history/ settings/   One feature component each
data/
  index.ts                 Categories + validated question bank
  questions/*.ts           Question files (one per category)
lib/
  quiz/                    selection, random, scoring, stats, validation, format (pure functions)
  attempts/lifecycle.ts    Create / answer / navigate / finalize / expire / retry (pure)
  storage/                 schema validation, repository (localStorage I/O), store (useSyncExternalStore)
types/quiz.ts              Shared domain types
tests/                     Vitest unit tests for all of the above
```

The main design rules:

- **Business logic is pure.** Scoring, selection and the attempt lifecycle are plain TypeScript functions with no React or browser APIs, so they can be tested directly.
- **One store, one source of truth.** `lib/storage/store.ts` owns all persisted data and is read through `useSyncExternalStore`. Dashboard, results, review and history all derive their numbers from the same attempts using the same `scoreAttempt` function. Changes such as clearing history update every view immediately, and other tabs stay in sync through the `storage` event.
- **Client/server boundary.** Pages are Server Components that render client feature components. `localStorage` is only touched on the client. On the server, and during hydration, the store reports `ready: false` and pages show a short loading state instead of guessing at stored data. Route params are read inside `<Suspense>`, as Cache Components requires.

## Question bank

Questions live in `data/questions/*.ts` and are declared with `defineQuestions`:

```ts
{
  id: "sci-009",                 // globally unique, stable
  difficulty: "medium",          // "easy" | "medium" | "hard"
  topic: "Biology",
  prompt: "In DNA, which base pairs with adenine?",
  options: ["Guanine", "Thymine", "Cytosine", "Uracil"],  // exactly four
  answer: 1,                     // index of the correct option as written
  explanation: "In DNA, adenine pairs with thymine…",
}
```

Options get stable IDs `a`–`d`, and the correct answer is stored as an option **ID**, so shuffling the display order never changes which answer is correct. At startup the bank is checked for unique IDs, exactly four options, a valid correct option, and non-empty text and explanation. Invalid questions are excluded (and logged in development), and a unit test fails if any question is invalid.

There are 45 original questions: Programming, General Knowledge and Science, each with 5 easy, 5 medium and 5 hard. To add a question, append it to the right file with a new unique ID. To add a category, add it to `categories` in `data/index.ts` and create a question file.

## Scoring

`lib/quiz/scoring.ts`:

```
score % = correct answers / total questions in the attempt × 100
```

- The denominator is always the total number of questions, so unanswered questions contribute 0.
- An answer is correct only if the selected option ID equals the question's `correctOptionId`. A selection that isn't one of the question's options (for example, from tampered storage) counts as unanswered.
- Each question ID is scored once, even if it appears twice in malformed data.
- Zero-question or malformed input returns 0, never `NaN` or `Infinity`.
- The displayed percentage is rounded to the nearest whole number. Averages are calculated from the unrounded values.

## Timer and attempt handling

- **Creating an attempt** validates the config, picks unique questions at random (keeping question-bank order unless shuffle is on), optionally shuffles each question's options, snapshots everything into the attempt, assigns a UUID and saves it **before** navigating to `/quiz/:id`. The Start button ignores repeated clicks.
- **Answers and the current question are saved on every change**, so refreshing or closing the tab never loses progress. In-progress quizzes appear on the dashboard with a Resume button.
- **The timer is a deadline timestamp** (`startedAt + limit`) stored with the attempt. The display recomputes `deadline − now` every 250 ms and whenever the tab becomes visible, so throttled tabs and refreshes can't reset or skew it.
- **When the deadline passes** the attempt is finalized automatically as **Time expired**, keeping every answer selected before the deadline, and `finishedAt` is set to the deadline itself. If the timer ran out while the app was closed, the attempt is finalized the next time the app loads.
- **Statuses.** Each finished attempt records how it ended:
  - **Completed**: the user submitted. Unanswered questions score zero.
  - **Ended early**: the user chose *End quiz* from the exit dialog. It is scored the same way but labelled differently everywhere, so it's never mistaken for a normal completion.
  - **Time expired**: see above.
- **Exactly once.** `finalizeAttempt` returns the attempt unchanged if it is already finished, the UI also guards with a ref, and attempts are stored by ID, so double-clicks and timer/submit races can't create duplicates or score twice. Finished attempts reject answer changes. Opening `/quiz/:id` for a finished attempt shows a read-only notice with a link to its results.
- **Retry** creates a brand-new attempt (new ID, fresh questions or shuffle, new timer) with the same settings. The original attempt is never modified.

## Persistence and its limits

Data is stored under two keys, each with a schema version:

| Key | Contents |
| --- | --- |
| `quizcraft:attempts` | `{ version: 1, attempts: QuizAttempt[] }`, both in-progress and finished |
| `quizcraft:preferences` | `{ version: 1, preferences: UserPreferences }` |

Everything read from storage is validated at runtime (`lib/storage/schema.ts`):

- Missing keys mean a first visit, so defaults are used.
- Corrupted JSON or an unknown schema version: the raw value is moved to a `…:backup:<timestamp>` key, the user sees a toast, and a fresh store is started.
- A single malformed attempt is hidden but kept in storage untouched, so one bad record never wipes valid history.
- Invalid preference fields fall back to their defaults one field at a time, and the repaired preferences are saved.
- If `localStorage` is unavailable (some private modes, or storage disabled), the app keeps working in memory and warns: *"Your history could not be saved in this browser…"*

**Important limitations:** `localStorage` belongs to one browser profile on one device. Data is **not** synced across devices, browsers or users, it is **not** backed up anywhere, and clearing site data or browsing privately will remove it. Anyone using the same browser profile can see it. No account-level privacy is implied.

## Getting started

Prerequisites: **Node.js 20.9 or newer** and npm.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm test` | Run unit tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run check` | Lint, type-check, test and build in one go |

## Deploying to Vercel

The app needs no environment variables, database or other services.

1. Push this folder to a GitHub, GitLab or Bitbucket repository.
2. In Vercel, choose **Add New → Project** and import the repository. Vercel detects Next.js automatically: build command `next build`, default output, Node 20 or newer.
3. Click **Deploy**.

Or, using the CLI from this folder:

```bash
npx vercel --prod
```

Because data lives in each visitor's browser, every visitor gets their own private history on their own device.

## Known limitations and future improvements

- No cross-device sync, export or import. A JSON export/import of history would be a natural next step.
- The question bank is static TypeScript. A larger bank, or one loaded from content files, would allow more variety, including 10- or 15-question single-difficulty quizzes (each difficulty currently has 5 questions per category).
- Statistics are overall only. Per-category trends and "weakest topic" suggestions could be added from the same attempt data.
- The timer keeps running if you leave a timed quiz. This is intentional, so a timed quiz can't be paused by closing the tab.
- Tests cover the pure logic and the store. There are no automated browser (end-to-end) tests yet; Playwright would be the next addition.
