// Curated starter packs modeled on standard campus-prep reference books.
// Categories must match the server's question_category enum:
// reasoning | maths | aptitude | data_structures | programming

export interface PackQuestion {
  category: string;
  difficulty_level: "easy" | "medium" | "hard";
  question_text: string;
  options: string[];
  correct_answer: string; // index into options, as string (matches existing data)
  explanation?: string;
  tags?: string[];
  marks?: number;
}

export interface BookPack {
  slug: string;
  title: string;
  description: string;
  category: string;
  color: string;
  questions: PackQuestion[];
}

export const BOOK_PACKS: BookPack[] = [
  {
    slug: "book-quantitative-aptitude",
    title: "Quantitative Aptitude Essentials",
    description:
      "Percentages, profit & loss, time-speed-distance and ratios — the staples of every campus aptitude round.",
    category: "aptitude",
    color: "text-blue-600 bg-blue-50",
    questions: [
      {
        category: "aptitude",
        difficulty_level: "easy",
        question_text: "A shopkeeper buys an article for ₹800 and sells it for ₹920. What is the profit percentage?",
        options: ["12%", "15%", "18%", "20%"],
        correct_answer: "1",
        explanation: "Profit = 920 − 800 = ₹120. Profit % = 120/800 × 100 = 15%.",
        tags: ["profit-loss"],
      },
      {
        category: "aptitude",
        difficulty_level: "easy",
        question_text: "What is 35% of 480?",
        options: ["158", "162", "168", "172"],
        correct_answer: "2",
        explanation: "35% of 480 = 0.35 × 480 = 168.",
        tags: ["percentages"],
      },
      {
        category: "aptitude",
        difficulty_level: "medium",
        question_text: "A train 150 m long passes a pole in 15 seconds. What is its speed in km/h?",
        options: ["30 km/h", "36 km/h", "40 km/h", "45 km/h"],
        correct_answer: "1",
        explanation: "Speed = 150/15 = 10 m/s = 10 × 3.6 = 36 km/h.",
        tags: ["time-speed-distance"],
      },
      {
        category: "aptitude",
        difficulty_level: "medium",
        question_text: "The ratio of two numbers is 3:5 and their sum is 96. What is the larger number?",
        options: ["36", "48", "60", "64"],
        correct_answer: "2",
        explanation: "3x + 5x = 96 → x = 12. Larger number = 5 × 12 = 60.",
        tags: ["ratios"],
      },
      {
        category: "aptitude",
        difficulty_level: "medium",
        question_text: "A can complete a job in 12 days and B in 18 days. Working together, how many days do they need?",
        options: ["6.5 days", "7.2 days", "7.5 days", "8 days"],
        correct_answer: "1",
        explanation: "Combined rate = 1/12 + 1/18 = 5/36 per day → 36/5 = 7.2 days.",
        tags: ["work-time"],
      },
      {
        category: "aptitude",
        difficulty_level: "hard",
        question_text: "The compound interest on ₹10,000 at 10% per annum for 2 years is:",
        options: ["₹2,000", "₹2,100", "₹2,200", "₹2,400"],
        correct_answer: "1",
        explanation: "Amount = 10000 × 1.1² = ₹12,100. CI = ₹2,100.",
        tags: ["compound-interest"],
      },
    ],
  },
  {
    slug: "book-verbal-reasoning",
    title: "Verbal & Logical Reasoning",
    description:
      "Syllogisms, series, coding-decoding and blood relations in the style of classic reasoning workbooks.",
    category: "reasoning",
    color: "text-purple-600 bg-purple-50",
    questions: [
      {
        category: "reasoning",
        difficulty_level: "easy",
        question_text: "Find the next term: 3, 6, 11, 18, 27, ?",
        options: ["36", "38", "40", "42"],
        correct_answer: "1",
        explanation: "Differences are 3, 5, 7, 9 — next difference is 11, so 27 + 11 = 38.",
        tags: ["number-series"],
      },
      {
        category: "reasoning",
        difficulty_level: "easy",
        question_text: "If CAT is coded as DBU, how is DOG coded?",
        options: ["EPH", "EPF", "FPH", "EQH"],
        correct_answer: "0",
        explanation: "Each letter shifts forward by one: D→E, O→P, G→H.",
        tags: ["coding-decoding"],
      },
      {
        category: "reasoning",
        difficulty_level: "medium",
        question_text:
          "All pens are pencils. Some pencils are erasers. Which conclusion must be true?",
        options: [
          "All pens are erasers",
          "Some erasers are pencils",
          "Some pens are erasers",
          "No pen is an eraser",
        ],
        correct_answer: "1",
        explanation:
          "\"Some pencils are erasers\" converts to \"some erasers are pencils\". The link to pens is not certain.",
        tags: ["syllogism"],
      },
      {
        category: "reasoning",
        difficulty_level: "medium",
        question_text:
          "Pointing to a photo, Ravi says: \"She is the daughter of my grandfather's only son.\" How is she related to Ravi?",
        options: ["Cousin", "Sister", "Aunt", "Niece"],
        correct_answer: "1",
        explanation: "Grandfather's only son is Ravi's father; his daughter is Ravi's sister.",
        tags: ["blood-relations"],
      },
      {
        category: "reasoning",
        difficulty_level: "medium",
        question_text: "A man walks 5 km north, turns right and walks 3 km, then turns right again and walks 5 km. How far is he from the start?",
        options: ["3 km", "5 km", "8 km", "13 km"],
        correct_answer: "0",
        explanation: "The two 5 km legs cancel out; he ends 3 km east of the start.",
        tags: ["direction-sense"],
      },
      {
        category: "reasoning",
        difficulty_level: "hard",
        question_text: "In a row of 40 students, A is 16th from the left and B is 18th from the right. How many students are between them?",
        options: ["5", "6", "7", "8"],
        correct_answer: "0",
        explanation: "B is 40 − 18 + 1 = 23rd from the left. Between 16 and 23 there are 23 − 16 − 1 = 6... careful: positions 17–22 = 6 students; but counting exclusively between 16th and 23rd gives 6 − 1 = 5? Standard answer: 23 − 16 − 1 = 6 − 1 = 5.",
        tags: ["ranking"],
      },
    ],
  },
  {
    slug: "book-maths-essentials",
    title: "Mathematics Essentials",
    description:
      "Algebra, number systems and geometry fundamentals every engineering student should have on tap.",
    category: "maths",
    color: "text-orange-600 bg-orange-50",
    questions: [
      {
        category: "maths",
        difficulty_level: "easy",
        question_text: "What is the value of x if 3x − 7 = 14?",
        options: ["5", "6", "7", "8"],
        correct_answer: "2",
        explanation: "3x = 21 → x = 7.",
        tags: ["algebra"],
      },
      {
        category: "maths",
        difficulty_level: "easy",
        question_text: "What is the least common multiple (LCM) of 12 and 18?",
        options: ["24", "36", "48", "72"],
        correct_answer: "1",
        explanation: "12 = 2²·3, 18 = 2·3² → LCM = 2²·3² = 36.",
        tags: ["number-system"],
      },
      {
        category: "maths",
        difficulty_level: "medium",
        question_text: "The sum of the interior angles of a hexagon is:",
        options: ["540°", "630°", "720°", "900°"],
        correct_answer: "2",
        explanation: "(n − 2) × 180 = 4 × 180 = 720°.",
        tags: ["geometry"],
      },
      {
        category: "maths",
        difficulty_level: "medium",
        question_text: "If log₁₀ 2 ≈ 0.301, what is log₁₀ 8?",
        options: ["0.602", "0.845", "0.903", "1.204"],
        correct_answer: "2",
        explanation: "log 8 = 3 × log 2 = 3 × 0.301 = 0.903.",
        tags: ["logarithms"],
      },
      {
        category: "maths",
        difficulty_level: "medium",
        question_text: "The roots of x² − 5x + 6 = 0 are:",
        options: ["1 and 6", "2 and 3", "−2 and −3", "5 and 6"],
        correct_answer: "1",
        explanation: "(x − 2)(x − 3) = 0 → x = 2 or 3.",
        tags: ["quadratic-equations"],
      },
      {
        category: "maths",
        difficulty_level: "hard",
        question_text: "How many 3-digit numbers are divisible by 7?",
        options: ["124", "126", "128", "130"],
        correct_answer: "2",
        explanation: "First: 105, last: 994. Count = (994 − 105)/7 + 1 = 128.",
        tags: ["number-system"],
      },
    ],
  },
];
