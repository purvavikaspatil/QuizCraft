import { defineQuestions } from "../define-question";

export const generalKnowledgeQuestions = defineQuestions("general-knowledge", [
  {
    id: "gk-001",
    difficulty: "easy",
    topic: "Geography",
    prompt: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
    answer: 2,
    explanation:
      "The Pacific Ocean covers roughly a third of Earth's surface, more than all the land area combined. The Atlantic is the second largest.",
  },
  {
    id: "gk-002",
    difficulty: "easy",
    topic: "Geography",
    prompt: "Which continent is the smallest by land area?",
    options: ["Australia", "Europe", "Antarctica", "South America"],
    answer: 0,
    explanation:
      "Australia (sometimes grouped with nearby islands as Oceania) is the smallest continent at about 7.7 million km². Europe is the second smallest.",
  },
  {
    id: "gk-003",
    difficulty: "easy",
    topic: "Astronomy",
    prompt: "Which planet is commonly called the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Mercury"],
    answer: 1,
    explanation:
      "Mars looks reddish because its surface is rich in iron oxide, the same compound that gives rust its color.",
  },
  {
    id: "gk-004",
    difficulty: "easy",
    topic: "Geography",
    prompt: "What is the capital city of Canada?",
    options: ["Toronto", "Vancouver", "Montreal", "Ottawa"],
    answer: 3,
    explanation:
      "Ottawa, in the province of Ontario, is Canada's capital. Toronto is the country's largest city, which makes it a common mix-up.",
  },
  {
    id: "gk-005",
    difficulty: "easy",
    topic: "Mathematics",
    prompt: "How many sides does a hexagon have?",
    options: ["Five", "Six", "Seven", "Eight"],
    answer: 1,
    explanation:
      "The prefix “hexa-” means six. A pentagon has five sides, a heptagon seven and an octagon eight.",
  },
  {
    id: "gk-006",
    difficulty: "medium",
    topic: "Geography",
    prompt: "Which river flows through Cairo, the capital of Egypt?",
    options: ["Tigris", "Euphrates", "Niger", "Nile"],
    answer: 3,
    explanation:
      "Cairo sits on the banks of the Nile, close to where the river fans out into its delta before reaching the Mediterranean Sea.",
  },
  {
    id: "gk-007",
    difficulty: "medium",
    topic: "History",
    prompt: "In which year did World War II end?",
    options: ["1939", "1945", "1918", "1950"],
    answer: 1,
    explanation:
      "The war ended in 1945: Germany surrendered in May and Japan formally surrendered in September. 1939 is when it began, and 1918 is the end of World War I.",
  },
  {
    id: "gk-008",
    difficulty: "medium",
    topic: "Geography",
    prompt: "The Great Barrier Reef lies off the coast of which Australian state?",
    options: ["Queensland", "New South Wales", "Western Australia", "Victoria"],
    answer: 0,
    explanation:
      "The Great Barrier Reef stretches more than 2,000 km along the coast of Queensland in north-eastern Australia.",
  },
  {
    id: "gk-009",
    difficulty: "medium",
    topic: "Languages",
    prompt: "Which language has the largest number of native speakers in the world?",
    options: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
    answer: 2,
    explanation:
      "Mandarin Chinese has the most native (first-language) speakers. English has more total speakers when second-language learners are included, but far fewer native speakers.",
  },
  {
    id: "gk-010",
    difficulty: "medium",
    topic: "Economics",
    prompt: "What is the official currency of Japan?",
    options: ["Won", "Yuan", "Ringgit", "Yen"],
    answer: 3,
    explanation:
      "Japan uses the yen (¥). The won is used in South Korea, the yuan (renminbi) in China and the ringgit in Malaysia.",
  },
  {
    id: "gk-011",
    difficulty: "hard",
    topic: "History",
    prompt: "In which year was the Magna Carta first sealed by King John of England?",
    options: ["1066", "1215", "1492", "1688"],
    answer: 1,
    explanation:
      "King John sealed the Magna Carta at Runnymede in 1215. It limited royal power and influenced later ideas about the rule of law. 1066 is the Norman Conquest.",
  },
  {
    id: "gk-012",
    difficulty: "hard",
    topic: "Geography",
    prompt: "What is the longest continental mountain range in the world?",
    options: ["The Himalayas", "The Rocky Mountains", "The Andes", "The Alps"],
    answer: 2,
    explanation:
      "The Andes run about 7,000 km along the western edge of South America. The Himalayas contain the highest peaks but are much shorter in length.",
  },
  {
    id: "gk-013",
    difficulty: "hard",
    topic: "Geography",
    prompt: "Counting overseas territories, which country spans the most time zones?",
    options: ["Russia", "United States", "China", "France"],
    answer: 3,
    explanation:
      "Thanks to territories spread across the globe, such as French Polynesia, Réunion and New Caledonia, France uses 12 time zones, more than any other country. Russia has the most within a single contiguous landmass (11).",
  },
  {
    id: "gk-014",
    difficulty: "hard",
    topic: "Geography",
    prompt: "Lake Baikal, the deepest lake in the world, is located in which country?",
    options: ["Russia", "Mongolia", "Kazakhstan", "China"],
    answer: 0,
    explanation:
      "Lake Baikal is in Siberia, Russia. It is over 1,600 m deep and holds roughly a fifth of the world's unfrozen surface fresh water.",
  },
  {
    id: "gk-015",
    difficulty: "hard",
    topic: "History",
    prompt: "The ancient rock-cut city of Petra is located in which present-day country?",
    options: ["Egypt", "Jordan", "Syria", "Lebanon"],
    answer: 1,
    explanation:
      "Petra, built by the Nabataeans and famous for buildings carved into rose-colored sandstone, is in southern Jordan.",
  },
]);
