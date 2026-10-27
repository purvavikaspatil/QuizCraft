import { defineQuestions } from "../define-question";

export const scienceQuestions = defineQuestions("science", [
  {
    id: "sci-001",
    difficulty: "easy",
    topic: "Chemistry",
    prompt: "What is the chemical formula for water?",
    options: ["CO₂", "H₂O", "O₂", "NaCl"],
    answer: 1,
    explanation:
      "Each water molecule is made of two hydrogen atoms bonded to one oxygen atom, written H₂O. CO₂ is carbon dioxide and NaCl is table salt.",
  },
  {
    id: "sci-002",
    difficulty: "easy",
    topic: "Biology",
    prompt: "Which gas do plants take in from the air to carry out photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Hydrogen", "Carbon dioxide"],
    answer: 3,
    explanation:
      "Plants absorb carbon dioxide and, using light energy and water, convert it into glucose. Oxygen is released as a by-product.",
  },
  {
    id: "sci-003",
    difficulty: "easy",
    topic: "Biology",
    prompt: "Which organelle produces most of the usable energy (ATP) in a eukaryotic cell?",
    options: ["Mitochondrion", "Nucleus", "Ribosome", "Golgi apparatus"],
    answer: 0,
    explanation:
      "Mitochondria carry out cellular respiration, producing most of the cell's ATP. The nucleus stores DNA, ribosomes build proteins and the Golgi apparatus packages them.",
  },
  {
    id: "sci-004",
    difficulty: "easy",
    topic: "Physics",
    prompt: "At standard sea-level pressure, at what temperature does pure water boil?",
    options: ["90 °C", "0 °C", "100 °C", "212 °C"],
    answer: 2,
    explanation:
      "Pure water boils at 100 °C at one standard atmosphere of pressure. 212 is the same temperature in Fahrenheit, and 0 °C is its freezing point.",
  },
  {
    id: "sci-005",
    difficulty: "easy",
    topic: "Physics",
    prompt: "Which force keeps the planets in orbit around the Sun?",
    options: ["Magnetism", "Gravity", "Friction", "Air resistance"],
    answer: 1,
    explanation:
      "The Sun's gravitational pull continuously bends each planet's path into an orbit. Space is nearly a vacuum, so friction and air resistance play no role.",
  },
  {
    id: "sci-006",
    difficulty: "medium",
    topic: "Physics",
    prompt: "What is the SI unit of force?",
    options: ["Joule", "Watt", "Pascal", "Newton"],
    answer: 3,
    explanation:
      "Force is measured in newtons (N); one newton accelerates 1 kg at 1 m/s². Joules measure energy, watts measure power and pascals measure pressure.",
  },
  {
    id: "sci-007",
    difficulty: "medium",
    topic: "Chemistry",
    prompt: "Which subatomic particle carries a negative electric charge?",
    options: ["Electron", "Proton", "Neutron", "Nucleus"],
    answer: 0,
    explanation:
      "Electrons are negatively charged and orbit the nucleus. Protons are positive, neutrons have no charge, and the nucleus (protons plus neutrons) is positive overall.",
  },
  {
    id: "sci-008",
    difficulty: "medium",
    topic: "Physics",
    prompt: "Approximately how fast does light travel in a vacuum?",
    options: [
      "300,000 metres per second",
      "30,000 kilometres per second",
      "300,000 kilometres per second",
      "3,000,000 kilometres per second",
    ],
    answer: 2,
    explanation:
      "The speed of light in a vacuum is about 299,792 km/s, commonly rounded to 300,000 km/s (3 × 10⁸ m/s). Note the units: 300,000 m/s would be a thousand times too slow.",
  },
  {
    id: "sci-009",
    difficulty: "medium",
    topic: "Biology",
    prompt: "In DNA, which base pairs with adenine?",
    options: ["Guanine", "Thymine", "Cytosine", "Uracil"],
    answer: 1,
    explanation:
      "In DNA, adenine pairs with thymine and guanine pairs with cytosine. Uracil replaces thymine in RNA, not DNA.",
  },
  {
    id: "sci-010",
    difficulty: "medium",
    topic: "Chemistry",
    prompt: "A solution with a pH of 3 is best described as:",
    options: ["Neutral", "Basic (alkaline)", "Isotonic", "Acidic"],
    answer: 3,
    explanation:
      "The pH scale runs from about 0 to 14 with 7 as neutral. Values below 7 are acidic and values above 7 are basic, so pH 3 is clearly acidic.",
  },
  {
    id: "sci-011",
    difficulty: "hard",
    topic: "Physics",
    prompt: "What net force is needed to accelerate a 2 kg object at 3 m/s²?",
    options: ["6 N", "1.5 N", "5 N", "0.67 N"],
    answer: 0,
    explanation:
      "Newton's second law states F = m × a. Here F = 2 kg × 3 m/s² = 6 N.",
  },
  {
    id: "sci-012",
    difficulty: "hard",
    topic: "Chemistry",
    prompt: "What is the approximate value of Avogadro's number?",
    options: ["3.00 × 10⁸", "6.022 × 10²³", "6.674 × 10⁻¹¹", "1.602 × 10⁻¹⁹"],
    answer: 1,
    explanation:
      "Avogadro's number, about 6.022 × 10²³, is the number of particles in one mole. The other values are the speed of light (m/s), the gravitational constant and the elementary charge.",
  },
  {
    id: "sci-013",
    difficulty: "hard",
    topic: "Biology",
    prompt: "During which phase of mitosis do sister chromatids separate and move to opposite poles of the cell?",
    options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
    answer: 2,
    explanation:
      "In anaphase the proteins holding sister chromatids together are cleaved, and spindle fibres pull the chromatids to opposite poles. They line up in metaphase before this happens.",
  },
  {
    id: "sci-014",
    difficulty: "hard",
    topic: "Physics",
    prompt:
      "A radioactive isotope has a half-life of 5 years. What fraction of a sample remains after 15 years?",
    options: ["1/3", "1/4", "1/6", "1/8"],
    answer: 3,
    explanation:
      "15 years is three half-lives. After each half-life half the remaining sample is left: 1/2 × 1/2 × 1/2 = 1/8.",
  },
  {
    id: "sci-015",
    difficulty: "hard",
    topic: "Chemistry",
    prompt:
      "For a fixed amount of an ideal gas at constant volume, what happens to the pressure if its absolute temperature (in kelvin) doubles?",
    options: ["It doubles", "It halves", "It stays the same", "It quadruples"],
    answer: 0,
    explanation:
      "From the ideal gas law PV = nRT, with n and V fixed, pressure is directly proportional to absolute temperature. Doubling T therefore doubles P.",
  },
]);
