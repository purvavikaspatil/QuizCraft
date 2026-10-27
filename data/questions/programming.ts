import { defineQuestions } from "../define-question";

export const programmingQuestions = defineQuestions("programming", [
  {
    id: "prog-001",
    difficulty: "easy",
    topic: "Complexity",
    prompt: "What is the time complexity of reading an element from an array by its index?",
    options: ["O(n)", "O(1)", "O(log n)", "O(n log n)"],
    answer: 1,
    explanation:
      "Array elements are stored contiguously, so the address of any index can be computed directly from the start address and element size. No scanning is needed, which makes indexed access constant time.",
  },
  {
    id: "prog-002",
    difficulty: "easy",
    topic: "Data structures",
    prompt: "Which data structure follows the Last-In, First-Out (LIFO) principle?",
    options: ["Queue", "Hash table", "Stack", "Linked list"],
    answer: 2,
    explanation:
      "A stack removes the most recently added element first, like a stack of plates. A queue is the opposite: First-In, First-Out (FIFO).",
  },
  {
    id: "prog-003",
    difficulty: "easy",
    topic: "Fundamentals",
    prompt: "What values can a boolean variable hold?",
    options: [
      "Only true or false",
      "Any whole number",
      "A single character",
      "A sequence of characters",
    ],
    answer: 0,
    explanation:
      "A boolean represents a logical truth value and has exactly two possible values: true and false. It is the type produced by comparisons such as `x > 3`.",
  },
  {
    id: "prog-004",
    difficulty: "easy",
    topic: "Fundamentals",
    prompt: "What is the result of the expression 17 % 5 (the modulo operator)?",
    options: ["3", "3.4", "12", "2"],
    answer: 3,
    explanation:
      "The modulo operator returns the remainder of a division. 17 divided by 5 is 3 with a remainder of 2, so 17 % 5 equals 2.",
  },
  {
    id: "prog-005",
    difficulty: "easy",
    topic: "JavaScript",
    prompt:
      "In JavaScript, which keyword declares a block-scoped variable whose binding cannot be reassigned?",
    options: ["var", "const", "let", "static"],
    answer: 1,
    explanation:
      "`const` creates a block-scoped binding that cannot be reassigned. `let` is also block-scoped but can be reassigned, and `var` is function-scoped.",
  },
  {
    id: "prog-006",
    difficulty: "medium",
    topic: "Algorithms",
    prompt: "Binary search only works correctly if the collection being searched is:",
    options: [
      "Stored in a linked list",
      "Free of duplicate values",
      "Sorted",
      "Of even length",
    ],
    answer: 2,
    explanation:
      "Binary search discards half of the remaining range after each comparison. That is only valid when the elements are in sorted order. Duplicates and odd lengths are fine.",
  },
  {
    id: "prog-007",
    difficulty: "medium",
    topic: "Graphs",
    prompt: "Which data structure is typically used to implement breadth-first search (BFS) on a graph?",
    options: ["Stack", "Queue", "Binary heap", "Trie"],
    answer: 1,
    explanation:
      "BFS explores vertices level by level. A FIFO queue ensures nodes discovered earlier are processed before nodes discovered later. Depth-first search is the one that uses a stack.",
  },
  {
    id: "prog-008",
    difficulty: "medium",
    topic: "Sorting",
    prompt: "What is the worst-case time complexity of quicksort?",
    options: ["O(n log n)", "O(n)", "O(log n)", "O(n²)"],
    answer: 3,
    explanation:
      "If the pivot is repeatedly the smallest or largest element (for example, a naive pivot on already-sorted input), each partition removes only one element, giving O(n²). Its average case is O(n log n).",
  },
  {
    id: "prog-009",
    difficulty: "medium",
    topic: "Object-oriented programming",
    prompt: "In object-oriented programming, what does encapsulation refer to?",
    options: [
      "Bundling data with the methods that operate on it and restricting direct access to internal state",
      "A class inheriting behavior from more than one parent class",
      "Using one interface to represent many different underlying types",
      "Automatically freeing memory that is no longer referenced",
    ],
    answer: 0,
    explanation:
      "Encapsulation keeps an object's internal state private and exposes behavior through methods. The other options describe multiple inheritance, polymorphism and garbage collection.",
  },
  {
    id: "prog-010",
    difficulty: "medium",
    topic: "Web",
    prompt: "What does the HTTP status code 404 mean?",
    options: [
      "The server encountered an internal error",
      "The request succeeded",
      "The requested resource was not found",
      "The client must authenticate first",
    ],
    answer: 2,
    explanation:
      "404 Not Found means the server could not find the requested resource. 500 is an internal server error, 200 is success and 401 indicates authentication is required.",
  },
  {
    id: "prog-011",
    difficulty: "hard",
    topic: "Algorithms",
    prompt: "Which of these problems is a classic example of one solved efficiently with dynamic programming?",
    options: [
      "Finding the maximum value in an unsorted array",
      "Longest common subsequence of two strings",
      "Reversing a singly linked list",
      "Searching a sorted array for a value",
    ],
    answer: 1,
    explanation:
      "Longest common subsequence has overlapping subproblems and optimal substructure, so storing intermediate results in a table reduces exponential work to O(m·n). The other tasks are solved with simple linear or logarithmic algorithms.",
  },
  {
    id: "prog-012",
    difficulty: "hard",
    topic: "Graphs",
    prompt: "How many edges does a tree with n nodes have?",
    options: ["n", "n + 1", "2n", "n − 1"],
    answer: 3,
    explanation:
      "A tree is a connected graph with no cycles. Every node except the root is connected to exactly one parent, giving n − 1 edges. Adding any more edge would create a cycle.",
  },
  {
    id: "prog-013",
    difficulty: "hard",
    topic: "Sorting",
    prompt: "Which sorting algorithm is stable and guarantees O(n log n) time in the worst case?",
    options: ["Merge sort", "Quicksort", "Heapsort", "Selection sort"],
    answer: 0,
    explanation:
      "Merge sort always splits the input in half and merges in linear time, giving O(n log n) in every case, and its standard merge keeps equal elements in their original order. Heapsort is O(n log n) but not stable, and quicksort can degrade to O(n²).",
  },
  {
    id: "prog-014",
    difficulty: "hard",
    topic: "Data structures",
    prompt:
      "In a binary heap stored in a 0-indexed array, at which index is the left child of the element at index i?",
    options: ["2i", "2i + 1", "2i + 2", "i / 2"],
    answer: 1,
    explanation:
      "With 0-based indexing, the children of index i are at 2i + 1 (left) and 2i + 2 (right), and the parent is at floor((i − 1) / 2).",
  },
  {
    id: "prog-015",
    difficulty: "hard",
    topic: "Graphs",
    prompt: "Dijkstra's shortest-path algorithm can produce incorrect results when the graph contains:",
    options: [
      "Cycles",
      "Undirected edges",
      "Negative edge weights",
      "More than one shortest path",
    ],
    answer: 2,
    explanation:
      "Dijkstra's algorithm assumes that once a vertex is finalized its distance can never decrease. A negative edge can break that assumption. Bellman-Ford handles negative weights.",
  },
]);
