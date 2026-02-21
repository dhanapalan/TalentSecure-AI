// =============================================================================
// TalentSecure AI — Adaptive Complexity Service
// =============================================================================
// Implements an Item Response Theory-lite adaptive engine:
//   • Student answers → correct/wrong signal
//   • Difficulty steps UP on correct, DOWN on wrong
//   • Fetches a random question from question_bank at the new difficulty
//   • Avoids re-serving already-seen questions via an exclusion list
// =============================================================================

import { query, queryOne } from "../config/database.js";
import {
  QuestionBankRow,
  QuestionCategory,
  DifficultyLevel,
} from "../types/index.js";
import { logger } from "../config/logger.js";

// ── Difficulty ladder ────────────────────────────────────────────────────────

const DIFFICULTY_LADDER: DifficultyLevel[] = ["easy", "medium", "hard"];

function stepDifficulty(
  current: DifficultyLevel,
  correct: boolean,
): DifficultyLevel {
  const idx = DIFFICULTY_LADDER.indexOf(current);
  if (correct) {
    // Move up (harder), cap at "hard"
    return DIFFICULTY_LADDER[Math.min(idx + 1, DIFFICULTY_LADDER.length - 1)];
  }
  // Move down (easier), floor at "easy"
  return DIFFICULTY_LADDER[Math.max(idx - 1, 0)];
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface AdaptiveRequest {
  /** The category to pull the next question from */
  category: string;
  /** Difficulty of the question the student just answered */
  current_difficulty: DifficultyLevel;
  /** Whether the student answered correctly */
  answered_correctly: boolean;
  /** IDs of questions already seen (to avoid repeats) */
  seen_question_ids?: string[];
}

export interface AdaptiveResponse {
  /** The newly selected question */
  question: QuestionBankRow | null;
  /** The difficulty that was targeted */
  target_difficulty: DifficultyLevel;
  /** The previous difficulty (for UI) */
  previous_difficulty: DifficultyLevel;
  /** Whether difficulty went up, down, or stayed */
  direction: "up" | "down" | "same";
  /** How many questions remain at the target difficulty (excluding seen) */
  pool_remaining: number;
  /** Whether we had to fall back to a different difficulty */
  fallback: boolean;
}

// ── Category alias mapping (same as curateBlueprint) ─────────────────────────

const CATEGORY_ALIAS: Record<string, QuestionCategory> = {
  reasoning: "reasoning",
  maths: "maths",
  math: "maths",
  aptitude: "aptitude",
  "data structures": "data_structures",
  data_structures: "data_structures",
  ds: "data_structures",
  programming: "programming",
};

function normalizeCategory(label: string): QuestionCategory {
  const key = label.trim().toLowerCase();
  const mapped = CATEGORY_ALIAS[key];
  if (!mapped) {
    throw new Error(
      `Unknown category: "${label}". Valid: ${Object.keys(CATEGORY_ALIAS).join(", ")}`,
    );
  }
  return mapped;
}

// ── Core adaptive function ───────────────────────────────────────────────────

export async function getNextAdaptiveQuestion(
  req: AdaptiveRequest,
): Promise<AdaptiveResponse> {
  const category = normalizeCategory(req.category);
  const prevDifficulty = req.current_difficulty;
  const targetDifficulty = stepDifficulty(prevDifficulty, req.answered_correctly);
  const seen = req.seen_question_ids ?? [];

  const direction =
    targetDifficulty === prevDifficulty
      ? "same"
      : DIFFICULTY_LADDER.indexOf(targetDifficulty) >
        DIFFICULTY_LADDER.indexOf(prevDifficulty)
      ? "up"
      : "down";

  logger.info("Adaptive engine: computing next question", {
    category,
    prevDifficulty,
    targetDifficulty,
    direction,
    seenCount: seen.length,
  });

  // Build exclusion clause
  const excludeClause =
    seen.length > 0
      ? `AND id NOT IN (${seen.map((_, i) => `$${i + 3}`).join(", ")})`
      : "";
  const baseParams: unknown[] = [category, targetDifficulty, ...seen];

  // Try to find a question at the target difficulty
  let question = await queryOne<QuestionBankRow>(
    `SELECT * FROM question_bank
     WHERE category = $1
       AND difficulty_level = $2
       AND is_active = TRUE
       ${excludeClause}
     ORDER BY RANDOM()
     LIMIT 1`,
    baseParams,
  );

  let fallback = false;

  // If no question at target difficulty, try adjacent difficulties
  if (!question) {
    logger.warn("Adaptive engine: no questions at target difficulty, falling back", {
      category,
      targetDifficulty,
    });
    fallback = true;

    // Try all difficulties in order of closeness
    const fallbackOrder = DIFFICULTY_LADDER
      .map((d) => ({ d, dist: Math.abs(DIFFICULTY_LADDER.indexOf(d) - DIFFICULTY_LADDER.indexOf(targetDifficulty)) }))
      .sort((a, b) => a.dist - b.dist)
      .filter((x) => x.d !== targetDifficulty)
      .map((x) => x.d);

    for (const fbDifficulty of fallbackOrder) {
      const fbParams: unknown[] = [category, fbDifficulty, ...seen];
      const fbExclude =
        seen.length > 0
          ? `AND id NOT IN (${seen.map((_, i) => `$${i + 3}`).join(", ")})`
          : "";

      question = await queryOne<QuestionBankRow>(
        `SELECT * FROM question_bank
         WHERE category = $1
           AND difficulty_level = $2
           AND is_active = TRUE
           ${fbExclude}
         ORDER BY RANDOM()
         LIMIT 1`,
        fbParams,
      );

      if (question) break;
    }
  }

  // Count remaining pool at target difficulty
  const countParams: unknown[] = [category, targetDifficulty, ...seen];
  const countExclude =
    seen.length > 0
      ? `AND id NOT IN (${seen.map((_, i) => `$${i + 3}`).join(", ")})`
      : "";
  const countRow = await queryOne<{ remaining: number }>(
    `SELECT COUNT(*)::int AS remaining FROM question_bank
     WHERE category = $1
       AND difficulty_level = $2
       AND is_active = TRUE
       ${countExclude}`,
    countParams,
  );

  return {
    question,
    target_difficulty: targetDifficulty,
    previous_difficulty: prevDifficulty,
    direction,
    pool_remaining: countRow?.remaining ?? 0,
    fallback,
  };
}
