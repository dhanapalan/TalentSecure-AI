// =============================================================================
// TalentSecure AI — Code Validation Service
// =============================================================================
// LeetCode-style validation: accepts student code + hidden test cases,
// executes each in the Judge0 sandbox, and returns a structured pass/fail
// report per test case with a final score.
// =============================================================================

import { logger } from "../config/logger.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  LANGUAGE_MAP,
  executeCode,
  type SubmissionResult,
} from "./codeExecution.service.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ValidateCodeRequest {
  sourceCode: string;
  language: string;
  questionId: string;
  testCases: { input: string; expectedOutput: string }[];
  timeLimitMs?: number;
  memoryLimitKb?: number;
}

export interface TestCaseVerdict {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  passed: boolean;
  status: string;          // "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | …
  time: string | null;     // seconds
  memory: number | null;   // KB
  error: string | null;    // stderr or compile error
}

export interface ValidationReport {
  questionId: string;
  language: string;
  totalTestCases: number;
  passed: number;
  failed: number;
  score: number;            // 0-100
  verdict: string;          // overall: "Accepted" | "Wrong Answer" | "Compilation Error" | …
  testResults: TestCaseVerdict[];
  compilationError: string | null;
}

// ── Judge0 status IDs ────────────────────────────────────────────────────────

const STATUS_ACCEPTED = 3;
const STATUS_WRONG_ANSWER = 4;
const STATUS_TLE = 5;
const STATUS_CE = 6;

function statusLabel(id: number, description: string): string {
  switch (id) {
    case STATUS_ACCEPTED:
      return "Accepted";
    case STATUS_WRONG_ANSWER:
      return "Wrong Answer";
    case STATUS_TLE:
      return "Time Limit Exceeded";
    case STATUS_CE:
      return "Compilation Error";
    default:
      return description || "Runtime Error";
  }
}

// ── Validate code against test cases ─────────────────────────────────────────

export async function validateCode(
  req: ValidateCodeRequest,
): Promise<ValidationReport> {
  const { sourceCode, language, questionId, testCases } = req;
  const timeLimitMs = req.timeLimitMs ?? 5000;
  const memoryLimitKb = req.memoryLimitKb ?? 262144;

  // Validate language support
  const langKey = language.toLowerCase();
  if (!LANGUAGE_MAP[langKey]) {
    throw new AppError(
      `Unsupported language "${language}". Supported: ${Object.keys(LANGUAGE_MAP).join(", ")}`,
      400,
    );
  }

  if (!testCases || testCases.length === 0) {
    throw new AppError("At least one test case is required", 400);
  }

  logger.info("Validating code", {
    questionId,
    language: langKey,
    testCaseCount: testCases.length,
  });

  const testResults: TestCaseVerdict[] = [];
  let compilationError: string | null = null;
  let overallVerdict = "Accepted";

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    try {
      const result: SubmissionResult = await executeCode({
        sourceCode,
        language: langKey,
        stdin: tc.input,
        expectedOutput: tc.expectedOutput.trim(),
        timeLimitMs,
        memoryLimitKb,
      });

      // ── Handle compilation error (short-circuit remaining) ──────────
      if (result.status.id === STATUS_CE) {
        compilationError = result.compileOutput || "Compilation failed";
        overallVerdict = "Compilation Error";

        // Mark this + all remaining as failed
        for (let j = i; j < testCases.length; j++) {
          testResults.push({
            testCaseIndex: j,
            input: testCases[j].input,
            expectedOutput: testCases[j].expectedOutput,
            actualOutput: null,
            passed: false,
            status: "Compilation Error",
            time: null,
            memory: null,
            error: compilationError,
          });
        }
        break;
      }

      // ── Compare output ──────────────────────────────────────────────
      const actual = (result.stdout ?? "").trim();
      const expected = tc.expectedOutput.trim();
      const passed =
        result.status.id === STATUS_ACCEPTED || actual === expected;

      const status = passed
        ? "Accepted"
        : statusLabel(result.status.id, result.status.description);

      if (!passed && overallVerdict === "Accepted") {
        overallVerdict = status;
      }

      testResults.push({
        testCaseIndex: i,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: result.stdout,
        passed,
        status,
        time: result.time,
        memory: result.memory,
        error: result.stderr || result.compileOutput || null,
      });
    } catch (err: any) {
      if (overallVerdict === "Accepted") {
        overallVerdict = "Runtime Error";
      }
      testResults.push({
        testCaseIndex: i,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: null,
        passed: false,
        status: "Runtime Error",
        time: null,
        memory: null,
        error: err.message,
      });
    }
  }

  const passedCount = testResults.filter((r) => r.passed).length;
  const score =
    testCases.length > 0
      ? Math.round((passedCount / testCases.length) * 100)
      : 0;

  if (score === 100) overallVerdict = "Accepted";

  logger.info("Validation complete", {
    questionId,
    language: langKey,
    passed: passedCount,
    total: testCases.length,
    verdict: overallVerdict,
  });

  return {
    questionId,
    language: langKey,
    totalTestCases: testCases.length,
    passed: passedCount,
    failed: testCases.length - passedCount,
    score,
    verdict: overallVerdict,
    testResults,
    compilationError,
  };
}
