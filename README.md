# QuizCraft

QuizCraft is a quiz practice app designed to help students test their knowledge, learn from mistakes, and track their performance over time.

## Problem Statement

Many quiz platforms focus only on displaying scores. QuizCraft focuses on learning by allowing users to review their answers, understand explanations, revisit incorrect or unanswered questions, and track their progress.

## Features

- **Dashboard:** View quiz statistics, recent activity, and unfinished quizzes.
- **Explore Quizzes:** Search and filter quizzes by category and difficulty.
- **Custom Quiz Setup:** Choose difficulty, question count, timer, and shuffle preferences.
- **Interactive Quizzes:** Answer questions one at a time, navigate between questions, and monitor progress.
- **Results:** View scores, correct and incorrect answers, unanswered questions, and time taken.
- **Answer Review:** Review answers with explanations and filter questions by outcome.
- **Quiz History:** View, filter, and sort previous attempts.
- **Settings:** Customize themes and quiz preferences.
- **Responsive Design:** Works across desktop and mobile screens.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Data Persistence:** Browser LocalStorage
- **Testing:** Vitest

## Question Bank

QuizCraft includes 45 questions across three categories:

- Programming
- General Knowledge
- Science

Each category contains 5 easy, 5 medium, and 5 hard questions, with explanations for learning and revision.

## Data Storage

Quiz attempts, history, and preferences are saved using browser LocalStorage. No account or backend is required.

**Note:** Data is stored locally in the current browser profile and does not sync across devices or browsers.

## Getting Started

### Prerequisites

- Node.js 20.9 or newer
- npm

### Installation

Clone the repository and navigate to the project directory.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Testing

Run the test suite:

```bash
npm test
```

Run all project checks, including linting, type-checking, tests, and production build:

```bash
npm run check
```

## Future Improvements

- Export and import quiz history.
- Add more questions and categories.
- Introduce category-wise performance analytics.
- Add automated end-to-end testing.


## Video Link

- https://drive.google.com/file/d/1q1rMokVngo_8iz5xVGN50ceWreER47Hm/view?usp=drive_link
